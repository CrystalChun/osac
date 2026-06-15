import { useMutation } from '@tanstack/react-query';

import type { ComputeInstance, ComputeInstancesListResponse } from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';
import {
  type BuildComputeInstanceCreateBodyInput,
  type ComputeInstancePowerAction,
  buildComputeInstanceCreateBody,
  buildComputeInstancePowerPatchBody,
} from './compute-instance-wire';

export type ListComputeInstancesParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useComputeInstances = (params: ListComputeInstancesParams = {}) => {
  return useApiQuery<ComputeInstancesListResponse, ComputeInstance[]>({
    queryKey: ['v1/compute_instances', null, params],
    select: (data: ComputeInstancesListResponse) => data.items,
  });
};

export const useComputeInstance = (id: string) => {
  return useApiQuery<ComputeInstance>({
    queryKey: ['v1/compute_instances', [id]],
  });
};

export const invalidateComputeInstancesQueries = async (
  qc: ReturnType<typeof useApiQueryClient>,
) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/compute_instances', null) });
};

/** Poll list after create; the list endpoint can lag behind the create response. */
export const POST_CREATE_LIST_POLL_MS = 500;
export const POST_CREATE_LIST_POLL_MAX_ATTEMPTS = 20;

export const pollComputeInstancesUntilListed = async (
  qc: ReturnType<typeof useApiQueryClient>,
  instanceId: string,
  signal?: { cancelled: boolean },
): Promise<void> => {
  for (let attempt = 0; attempt < POST_CREATE_LIST_POLL_MAX_ATTEMPTS; attempt++) {
    if (signal?.cancelled) {
      return;
    }
    await invalidateComputeInstancesQueries(qc);
    const data = qc.getQueryData<ComputeInstancesListResponse>(
      apiQueryKey('v1/compute_instances', null),
    );
    if (data?.items?.some((v) => v.id === instanceId)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, POST_CREATE_LIST_POLL_MS));
  }
};

export type ProvisionComputeInstanceInput = {
  vm: BuildComputeInstanceCreateBodyInput;
  /** When true, POST body must include `spec.catalog_item`. */
  specCatalogItemOnly?: boolean;
  /** @deprecated Use specCatalogItemOnly for wizard create-from-catalog. */
  specTemplateOnly?: boolean;
};

export const useProvisionComputeInstance = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ vm, specCatalogItemOnly, specTemplateOnly }: ProvisionComputeInstanceInput) =>
      apiFetch<ComputeInstance>('v1/compute_instances', {
        method: 'POST',
        body: buildComputeInstanceCreateBody(vm, {
          specCatalogItemOnly,
          specTemplateOnly,
        }),
      }),
    onSuccess: async () => {
      await invalidateComputeInstancesQueries(qc);
    },
  });
};

export type PatchComputeInstanceInput =
  | { id: string; patch: Record<string, unknown> }
  | { id: string; powerAction: ComputeInstancePowerAction };

export const usePatchComputeInstance = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (input: PatchComputeInstanceInput) =>
      apiFetch<ComputeInstance>('v1/compute_instances', {
        pathParams: [input.id],
        method: 'PATCH',
        body:
          'powerAction' in input
            ? buildComputeInstancePowerPatchBody(input.powerAction)
            : input.patch,
      }),
    onSuccess: async (_updated, input) => {
      if ('powerAction' in input) {
        return;
      }
      await invalidateComputeInstancesQueries(qc);
    },
  });
};

export const useDeleteComputeInstance = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/compute_instances', {
        pathParams: [id],
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await invalidateComputeInstancesQueries(qc);
    },
  });
};

export type { ComputeInstancePowerAction } from './compute-instance-wire';
