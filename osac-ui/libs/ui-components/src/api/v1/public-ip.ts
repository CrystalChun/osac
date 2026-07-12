import { type Client } from '@connectrpc/connect';
import { useMutation } from '@tanstack/react-query';

import { type IPFamily, PublicIPAttachments, PublicIPState, PublicIPs } from '@osac/types';

import { invalidateComputeInstancesQueries } from './compute-instance';
import { useApiFetch } from '../api-context';
import { useApiQueryClient } from '../use-api-query';

export const PUBLIC_IP_ALLOCATION_POLL_MS = 500;
export const PUBLIC_IP_ALLOCATION_POLL_MAX_ATTEMPTS = 20;

export const pollPublicIpUntilAllocated = async (
  publicIpsClient: Client<typeof PublicIPs>,
  id: string,
) => {
  for (let attempt = 0; attempt < PUBLIC_IP_ALLOCATION_POLL_MAX_ATTEMPTS; attempt++) {
    const resp = await publicIpsClient.get({ id });
    if (!resp.object) {
      throw new Error('Public IP not found in response');
    }
    const publicIp = resp.object;
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

export const useAttachPublicIp = () => {
  const publicIpsClient = useApiFetch(PublicIPs);
  const attachmentsClient = useApiFetch(PublicIPAttachments);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async ({ computeInstanceId, ipFamily }: AttachPublicIpInput) => {
      const createResp = await publicIpsClient.create({ object: { spec: { ipFamily } } });
      if (!createResp.object) {
        throw new Error('Public IP not found in response');
      }
      const created = createResp.object;

      let allocated;
      try {
        allocated = await pollPublicIpUntilAllocated(publicIpsClient, created.id);
      } catch (err) {
        await publicIpsClient.delete({ id: created.id }).catch(() => undefined);
        throw err;
      }

      try {
        const attachResp = await attachmentsClient.create({
          object: {
            spec: {
              publicIp: allocated.id,
              target: { case: 'computeInstance', value: computeInstanceId },
            },
          },
        });
        return attachResp.object;
      } catch (err) {
        await publicIpsClient.delete({ id: allocated.id }).catch(() => undefined);
        throw err;
      }
    },
    onSuccess: () => invalidateComputeInstancesQueries(qc),
  });
};
