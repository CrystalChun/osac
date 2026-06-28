import { useMutation } from '@tanstack/react-query';

import {
  type ComputeInstance,
  ComputeInstanceSchema,
  type ComputeInstancesListResponse,
  ComputeInstancesListResponseSchema,
} from '@osac/types';

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

export const useComputeInstances = (params: ListComputeInstancesParams = {}) =>
  useApiQuery<ComputeInstancesListResponse, ComputeInstance[]>({
    queryKey: ['v1/compute_instances', null, params],
    select: (data: ComputeInstancesListResponse) => data.items,
    meta: { decode: ComputeInstancesListResponseSchema },
  });

export const useComputeInstance = (id: string) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<ComputeInstance>({
    queryKey: ['v1/compute_instances', [trimmedId]],
    meta: { decode: ComputeInstanceSchema },
    enabled: Boolean(trimmedId),
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

export type ProvisionComputeInstanceResult = {
  instance: ComputeInstance;
  warnings: string[];
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
    mutationFn: async ({
      vm,
      specCatalogItemOnly,
      specTemplateOnly,
    }: ProvisionComputeInstanceInput): Promise<ProvisionComputeInstanceResult> => {
      // REST Create uses response_body: "object", so the HTTP body is the ComputeInstance
      // itself — not ComputeInstancesCreateResponse { object, warnings }.
      const instance = await apiFetch<ComputeInstance>('v1/compute_instances', {
        method: 'POST',
        body: buildComputeInstanceCreateBody(vm, {
          specCatalogItemOnly,
          specTemplateOnly,
        }),
        decode: ComputeInstanceSchema,
      });
      if (!instance.id) {
        throw new Error('Create response missing id');
      }
      return {
        instance,
        warnings: [],
      };
    },
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
        decode: ComputeInstanceSchema,
      }),
    onSuccess: () => invalidateComputeInstancesQueries(qc),
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
    onSuccess: () => invalidateComputeInstancesQueries(qc),
  });
};

export type { ComputeInstancePowerAction } from './compute-instance-wire';
