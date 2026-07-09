import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PublicIPState } from '@osac/types';

import {
  PUBLIC_IP_ALLOCATION_POLL_MAX_ATTEMPTS,
  PUBLIC_IP_ALLOCATION_POLL_MS,
  pollPublicIpUntilAllocated,
  useAttachPublicIp,
} from './public-ip';
import { ApiProvider } from '../api-context';
import type { ApiFetch } from '../types';

const publicIpWithState = (state: PublicIPState, message?: string) => ({
  id: 'pip-1',
  status: { state, message },
});

describe('pollPublicIpUntilAllocated', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves as soon as the PublicIP reaches ALLOCATED', async () => {
    const apiFetch = vi
      .fn()
      .mockResolvedValue(publicIpWithState(PublicIPState.PUBLIC_IP_STATE_ALLOCATED));

    const result = await pollPublicIpUntilAllocated(apiFetch, 'pip-1');

    expect(result.status?.state).toBe(PublicIPState.PUBLIC_IP_STATE_ALLOCATED);
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch).toHaveBeenCalledWith(
      'v1/public_ips',
      expect.objectContaining({
        pathParams: ['pip-1'],
      }),
    );
  });

  it('keeps polling through PENDING until ALLOCATED', async () => {
    const apiFetch = vi
      .fn()
      .mockResolvedValueOnce(publicIpWithState(PublicIPState.PUBLIC_IP_STATE_PENDING))
      .mockResolvedValueOnce(publicIpWithState(PublicIPState.PUBLIC_IP_STATE_PENDING))
      .mockResolvedValueOnce(publicIpWithState(PublicIPState.PUBLIC_IP_STATE_ALLOCATED));

    const resultPromise = pollPublicIpUntilAllocated(apiFetch, 'pip-1');
    await vi.advanceTimersByTimeAsync(PUBLIC_IP_ALLOCATION_POLL_MS * 2);
    const result = await resultPromise;

    expect(result.status?.state).toBe(PublicIPState.PUBLIC_IP_STATE_ALLOCATED);
    expect(apiFetch).toHaveBeenCalledTimes(3);
  });

  it('throws with the status message when the PublicIP reaches FAILED', async () => {
    const apiFetch = vi
      .fn()
      .mockResolvedValue(
        publicIpWithState(PublicIPState.PUBLIC_IP_STATE_FAILED, 'no IPv4 addresses available'),
      );

    await expect(pollPublicIpUntilAllocated(apiFetch, 'pip-1')).rejects.toThrow(
      'no IPv4 addresses available',
    );
  });

  it('propagates an apiFetch rejection without retrying', async () => {
    const apiFetch = vi.fn().mockRejectedValue(new Error('network error'));

    await expect(pollPublicIpUntilAllocated(apiFetch, 'pip-1')).rejects.toThrow('network error');
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('throws a timeout error after exhausting all poll attempts', async () => {
    const apiFetch = vi
      .fn()
      .mockResolvedValue(publicIpWithState(PublicIPState.PUBLIC_IP_STATE_PENDING));

    const resultPromise = pollPublicIpUntilAllocated(apiFetch, 'pip-1');
    const assertion = expect(resultPromise).rejects.toThrow(
      'Timed out waiting for the public IP to be allocated',
    );
    await vi.advanceTimersByTimeAsync(
      PUBLIC_IP_ALLOCATION_POLL_MS * PUBLIC_IP_ALLOCATION_POLL_MAX_ATTEMPTS,
    );
    await assertion;
    expect(apiFetch).toHaveBeenCalledTimes(PUBLIC_IP_ALLOCATION_POLL_MAX_ATTEMPTS);
  });
});

const renderUseAttachPublicIp = (apiFetch: ApiFetch) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ApiProvider fetch={apiFetch}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApiProvider>
  );
  return renderHook(() => useAttachPublicIp(), { wrapper });
};

describe('useAttachPublicIp', () => {
  it('creates the PublicIP, polls until allocated, then attaches it to the ComputeInstance', async () => {
    const apiFetch = vi.fn(async (route: string, options: Record<string, unknown> = {}) => {
      if (route === 'v1/public_ips' && options.method === 'POST') {
        return publicIpWithState(PublicIPState.PUBLIC_IP_STATE_PENDING);
      }
      if (route === 'v1/public_ips' && !options.method) {
        return publicIpWithState(PublicIPState.PUBLIC_IP_STATE_ALLOCATED);
      }
      if (route === 'v1/public_ip_attachments' && options.method === 'POST') {
        return { id: 'attachment-1', ...(options.body as object) };
      }
      throw new Error(`unexpected call: ${route} ${JSON.stringify(options)}`);
    }) as unknown as ApiFetch;

    const { result } = renderUseAttachPublicIp(apiFetch);
    result.current.mutate({ computeInstanceId: 'vm-1', ipFamily: 1 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      id: 'attachment-1',
      spec: { publicIp: 'pip-1', computeInstance: 'vm-1' },
    });
    expect(apiFetch).toHaveBeenCalledWith(
      'v1/public_ip_attachments',
      expect.objectContaining({
        body: { spec: { publicIp: 'pip-1', computeInstance: 'vm-1' } },
      }),
    );
  });

  it('rolls back the allocated PublicIP when creating the attachment fails', async () => {
    const deletedIds: unknown[] = [];
    const apiFetch = vi.fn(async (route: string, options: Record<string, unknown> = {}) => {
      if (route === 'v1/public_ips' && options.method === 'POST') {
        return publicIpWithState(PublicIPState.PUBLIC_IP_STATE_PENDING);
      }
      if (route === 'v1/public_ips' && !options.method) {
        return publicIpWithState(PublicIPState.PUBLIC_IP_STATE_ALLOCATED);
      }
      if (route === 'v1/public_ips' && options.method === 'DELETE') {
        deletedIds.push((options.pathParams as string[])[0]);
        return undefined;
      }
      if (route === 'v1/public_ip_attachments' && options.method === 'POST') {
        throw new Error('a PublicIPAttachment already exists for ComputeInstance');
      }
      throw new Error(`unexpected call: ${route} ${JSON.stringify(options)}`);
    }) as unknown as ApiFetch;

    const { result } = renderUseAttachPublicIp(apiFetch);
    result.current.mutate({ computeInstanceId: 'vm-1', ipFamily: 1 });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(getErrorMessageFromResult(result.current.error)).toContain(
      'a PublicIPAttachment already exists',
    );
    expect(deletedIds).toEqual(['pip-1']);
  });
});

const getErrorMessageFromResult = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
