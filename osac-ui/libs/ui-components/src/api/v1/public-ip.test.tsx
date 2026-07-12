import type { ReactNode } from 'react';
import { type Client, Code, ConnectError, createRouterTransport } from '@connectrpc/connect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ComputeInstances, PublicIPAttachments, PublicIPState, PublicIPs } from '@osac/types';

import {
  PUBLIC_IP_ALLOCATION_POLL_MAX_ATTEMPTS,
  PUBLIC_IP_ALLOCATION_POLL_MS,
  pollPublicIpUntilAllocated,
  useAttachPublicIp,
} from './public-ip';
import { ApiProvider } from '../api-context';

const publicIpWithState = (state: PublicIPState, message?: string) => ({
  id: 'pip-1',
  status: { state, message },
});

const createMockPublicIpsClient = (getMock: ReturnType<typeof vi.fn>): Client<typeof PublicIPs> =>
  ({
    get: getMock,
    create: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
  }) as unknown as Client<typeof PublicIPs>;

describe('pollPublicIpUntilAllocated', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves as soon as the PublicIP reaches ALLOCATED', async () => {
    const getMock = vi
      .fn()
      .mockResolvedValue({ object: publicIpWithState(PublicIPState.PUBLIC_IP_STATE_ALLOCATED) });
    const client = createMockPublicIpsClient(getMock);

    const result = await pollPublicIpUntilAllocated(client, 'pip-1');

    expect(result.status?.state).toBe(PublicIPState.PUBLIC_IP_STATE_ALLOCATED);
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith({ id: 'pip-1' });
  });

  it('keeps polling through PENDING until ALLOCATED', async () => {
    const getMock = vi
      .fn()
      .mockResolvedValueOnce({ object: publicIpWithState(PublicIPState.PUBLIC_IP_STATE_PENDING) })
      .mockResolvedValueOnce({ object: publicIpWithState(PublicIPState.PUBLIC_IP_STATE_PENDING) })
      .mockResolvedValueOnce({
        object: publicIpWithState(PublicIPState.PUBLIC_IP_STATE_ALLOCATED),
      });
    const client = createMockPublicIpsClient(getMock);

    const resultPromise = pollPublicIpUntilAllocated(client, 'pip-1');
    await vi.advanceTimersByTimeAsync(PUBLIC_IP_ALLOCATION_POLL_MS * 2);
    const result = await resultPromise;

    expect(result.status?.state).toBe(PublicIPState.PUBLIC_IP_STATE_ALLOCATED);
    expect(getMock).toHaveBeenCalledTimes(3);
  });

  it('throws with the status message when the PublicIP reaches FAILED', async () => {
    const getMock = vi.fn().mockResolvedValue({
      object: publicIpWithState(
        PublicIPState.PUBLIC_IP_STATE_FAILED,
        'no IPv4 addresses available',
      ),
    });
    const client = createMockPublicIpsClient(getMock);

    await expect(pollPublicIpUntilAllocated(client, 'pip-1')).rejects.toThrow(
      'no IPv4 addresses available',
    );
  });

  it('propagates a client rejection without retrying', async () => {
    const getMock = vi.fn().mockRejectedValue(new Error('network error'));
    const client = createMockPublicIpsClient(getMock);

    await expect(pollPublicIpUntilAllocated(client, 'pip-1')).rejects.toThrow('network error');
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it('throws a timeout error after exhausting all poll attempts', async () => {
    const getMock = vi.fn().mockResolvedValue({
      object: publicIpWithState(PublicIPState.PUBLIC_IP_STATE_PENDING),
    });
    const client = createMockPublicIpsClient(getMock);

    const resultPromise = pollPublicIpUntilAllocated(client, 'pip-1');
    const assertion = expect(resultPromise).rejects.toThrow(
      'Timed out waiting for the public IP to be allocated',
    );
    await vi.advanceTimersByTimeAsync(
      PUBLIC_IP_ALLOCATION_POLL_MS * PUBLIC_IP_ALLOCATION_POLL_MAX_ATTEMPTS,
    );
    await assertion;
    expect(getMock).toHaveBeenCalledTimes(PUBLIC_IP_ALLOCATION_POLL_MAX_ATTEMPTS);
  });
});

const createAttachPublicIpTransport = ({
  onPublicIpDelete,
  onAttachmentCreate,
}: {
  onPublicIpDelete?: (req: { id: string }) => void;
  onAttachmentCreate?: (req: { object?: unknown }) => unknown;
} = {}) =>
  createRouterTransport((router) => {
    router.service(PublicIPs, {
      create: () => ({ object: publicIpWithState(PublicIPState.PUBLIC_IP_STATE_PENDING) }),
      get: () => ({ object: publicIpWithState(PublicIPState.PUBLIC_IP_STATE_ALLOCATED) }),
      delete: (req) => {
        onPublicIpDelete?.(req);
        return {};
      },
    });

    router.service(PublicIPAttachments, {
      create: (req) => {
        if (onAttachmentCreate) {
          return { object: onAttachmentCreate(req) };
        }
        return {
          object: {
            id: 'attachment-1',
            spec: {
              publicIp: 'pip-1',
              target: req.object?.spec?.target,
            },
          },
        };
      },
    });

    router.service(ComputeInstances, {
      list: () => ({ items: [] }),
    });
  });

const renderUseAttachPublicIp = (transport: ReturnType<typeof createAttachPublicIpTransport>) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ApiProvider transport={transport}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApiProvider>
  );
  return renderHook(() => useAttachPublicIp(), { wrapper });
};

describe('useAttachPublicIp', () => {
  it('creates the PublicIP, polls until allocated, then attaches it to the ComputeInstance', async () => {
    const transport = createAttachPublicIpTransport();

    const { result } = renderUseAttachPublicIp(transport);
    result.current.mutate({ computeInstanceId: 'vm-1', ipFamily: 1 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.spec?.publicIp).toBe('pip-1');
  });

  it('rolls back the allocated PublicIP when creating the attachment fails', async () => {
    const deletedIds: string[] = [];
    const transport = createAttachPublicIpTransport({
      onPublicIpDelete: (req) => {
        deletedIds.push(req.id);
      },
      onAttachmentCreate: () => {
        throw new ConnectError(
          'a PublicIPAttachment already exists for ComputeInstance',
          Code.AlreadyExists,
        );
      },
    });

    const { result } = renderUseAttachPublicIp(transport);
    result.current.mutate({ computeInstanceId: 'vm-1', ipFamily: 1 });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(getErrorMessageFromResult(result.current.error)).toContain(
      'a PublicIPAttachment already exists',
    );
    expect(deletedIds).toEqual(['pip-1']);
  });
});

const getErrorMessageFromResult = (error: unknown): string => {
  if (error instanceof ConnectError) {
    return error.rawMessage;
  }
  return error instanceof Error ? error.message : String(error);
};
