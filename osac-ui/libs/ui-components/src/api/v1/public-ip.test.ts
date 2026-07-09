import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PublicIPState } from '@osac/types';

import {
  PUBLIC_IP_ALLOCATION_POLL_MAX_ATTEMPTS,
  PUBLIC_IP_ALLOCATION_POLL_MS,
  pollPublicIpUntilAllocated,
} from './public-ip';

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
