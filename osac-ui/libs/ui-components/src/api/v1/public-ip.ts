import { useMutation } from '@tanstack/react-query';

import {
  IPFamily,
  type PublicIP,
  type PublicIPAttachment,
  PublicIPAttachmentSchema,
  PublicIPSchema,
  PublicIPState,
} from '@osac/types';

import { invalidateComputeInstancesQueries } from './compute-instance';
import { useApiFetch } from '../api-context';
import type { ApiFetch } from '../types';
import { useApiQueryClient } from '../use-api-query';

/** Poll for the auto-selected pool to allocate an address; allocation is quick but asynchronous. */
export const PUBLIC_IP_ALLOCATION_POLL_MS = 500;
export const PUBLIC_IP_ALLOCATION_POLL_MAX_ATTEMPTS = 20;

export const pollPublicIpUntilAllocated = async (
  apiFetch: ApiFetch,
  id: string,
): Promise<PublicIP> => {
  for (let attempt = 0; attempt < PUBLIC_IP_ALLOCATION_POLL_MAX_ATTEMPTS; attempt++) {
    const publicIp = await apiFetch<PublicIP>('v1/public_ips', {
      pathParams: [id],
      decode: PublicIPSchema,
    });
    const state = publicIp.status?.state;
    if (state === PublicIPState.PUBLIC_IP_STATE_ALLOCATED) {
      return publicIp;
    }
    if (state === PublicIPState.PUBLIC_IP_STATE_FAILED) {
      throw new Error(publicIp.status?.message || 'Public IP allocation failed');
    }
    await new Promise((resolve) => setTimeout(resolve, PUBLIC_IP_ALLOCATION_POLL_MS));
  }
  throw new Error('Timed out waiting for the public IP to be allocated');
};

export type AttachPublicIpInput = {
  computeInstanceId: string;
  ipFamily: IPFamily;
};

/**
 * Allocates a public IP (auto-selecting a READY pool for the given family) and attaches it to a
 * running ComputeInstance. Both PublicIPAttachment.spec.public_ip (ALLOCATED state) and
 * spec.compute_instance (RUNNING state) preconditions are enforced server-side; the caller is
 * expected to only invoke this once the target VM is confirmed RUNNING.
 */
export const useAttachPublicIp = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async ({
      computeInstanceId,
      ipFamily,
    }: AttachPublicIpInput): Promise<PublicIPAttachment> => {
      const created = await apiFetch<PublicIP>('v1/public_ips', {
        method: 'POST',
        body: { spec: { ipFamily } },
        decode: PublicIPSchema,
      });
      if (!created.id) {
        throw new Error('Create response missing id');
      }

      let allocated: PublicIP;
      try {
        allocated = await pollPublicIpUntilAllocated(apiFetch, created.id);
      } catch (err) {
        // Best-effort cleanup: Delete requires ALLOCATED state, so this only succeeds if the
        // PublicIP allocated in the window between our last poll and giving up; otherwise it's
        // a harmless no-op and the resource is left for backend cleanup.
        await apiFetch<void>('v1/public_ips', {
          pathParams: [created.id],
          method: 'DELETE',
        }).catch(() => undefined);
        throw err;
      }

      try {
        return await apiFetch<PublicIPAttachment>('v1/public_ip_attachments', {
          method: 'POST',
          body: { spec: { publicIp: allocated.id, computeInstance: computeInstanceId } },
          decode: PublicIPAttachmentSchema,
        });
      } catch (err) {
        // Best-effort cleanup: avoid leaking an allocated-but-unattached PublicIP. Delete only
        // requires ALLOCATED state, which is already satisfied here.
        await apiFetch<void>('v1/public_ips', {
          pathParams: [allocated.id],
          method: 'DELETE',
        }).catch(() => undefined);
        throw err;
      }
    },
    onSuccess: () => invalidateComputeInstancesQueries(qc),
  });
};
