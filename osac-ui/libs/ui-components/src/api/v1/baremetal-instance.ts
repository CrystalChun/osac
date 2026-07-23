import { type MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import {
  BareMetalInstanceCatalogItems,
  BareMetalInstanceRunStrategy,
  BareMetalInstanceSchema,
  BareMetalInstances,
} from '@osac/types';
import { BareMetalInstanceCatalogItems as PrivateBareMetalInstanceCatalogItems } from '@osac/types/private';

import { useSession } from '../../hooks/use-session';
import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../use-api-query';

export const useBareMetalInstances = () => {
  const client = useApiFetch(BareMetalInstances);
  return useApiQuery({
    queryKey: apiQueryKey('v1/baremetal_instances'),
    queryFn: () => client.list({}),
    select: (data) => data.items,
  });
};

export const useBareMetalInstance = (id: string) => {
  const client = useApiFetch(BareMetalInstances);
  return useApiQuery({
    queryKey: apiQueryKey('v1/baremetal_instances', [id]),
    queryFn: () => client.get({ id }),
    select: (data) => data.object,
    enabled: Boolean(id),
  });
};

export const useBareMetalInstanceCatalogItems = (enabled = true) => {
  const client = useApiFetch(BareMetalInstanceCatalogItems);
  return useApiQuery({
    queryKey: apiQueryKey('v1/baremetal_instance_catalog_items'),
    queryFn: () => client.list({}),
    select: (data) => data.items,
    enabled,
  });
};

/**
 * Admin list hook for the catalog management pages. CSP Admin (`providerAdmin`) sees all items via
 * the private API (including unpublished); Tenant Admin sees their tenant's items via the public API,
 * which the server already scopes to the caller's tenant regardless of publication status.
 */
export const useAdminBareMetalInstanceCatalogItems = (params: ListParams = {}, enabled = true) => {
  const { role } = useSession();
  const isProviderAdmin = role === 'providerAdmin';
  const publicClient = useApiFetch(BareMetalInstanceCatalogItems);
  const publicResult = useApiQuery({
    queryKey: apiQueryKey('v1/baremetal_instance_catalog_items', undefined, params),
    queryFn: () => publicClient.list(params),
    select: (data) => data.items,
    enabled: enabled && !isProviderAdmin,
  });
  const privateClient = useApiFetch(PrivateBareMetalInstanceCatalogItems);
  const privateResult = useApiQuery({
    queryKey: apiQueryKey('v1/baremetal_instance_catalog_items_private', undefined, params),
    queryFn: () => privateClient.list(params),
    select: (data) => data.items,
    enabled: enabled && isProviderAdmin,
  });
  return isProviderAdmin ? privateResult : publicResult;
};

export const useAdminSetBareMetalInstanceCatalogItemPublished = () => {
  const { role } = useSession();
  const isProviderAdmin = role === 'providerAdmin';
  const publicClient = useApiFetch(BareMetalInstanceCatalogItems);
  const privateClient = useApiFetch(PrivateBareMetalInstanceCatalogItems);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }): Promise<void> =>
      (isProviderAdmin
        ? privateClient.update({ object: { id, published }, updateMask: { paths: ['published'] } })
        : publicClient.update({ object: { id, published }, updateMask: { paths: ['published'] } })
      ).then(() => undefined),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: apiQueryKey(
          isProviderAdmin
            ? 'v1/baremetal_instance_catalog_items_private'
            : 'v1/baremetal_instance_catalog_items',
        ),
      }),
  });
};

export const invalidateBareMetalInstancesQueries = async (qc: ApiQueryClient) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/baremetal_instances') });
};

export type BareMetalPowerAction = 'start' | 'stop' | 'restart';

export type PatchBareMetalInstanceInput =
  | { id: string; action: 'start' | 'stop' }
  | { id: string; action: 'restart'; currentTrigger: bigint };

const buildPatchBody = (
  input: PatchBareMetalInstanceInput,
): MessageInitShape<typeof BareMetalInstanceSchema> => {
  switch (input.action) {
    case 'start':
      return { spec: { runStrategy: BareMetalInstanceRunStrategy.ALWAYS } };
    case 'stop':
      return { spec: { runStrategy: BareMetalInstanceRunStrategy.HALTED } };
    case 'restart':
      return { spec: { restartTrigger: input.currentTrigger + 1n } };
  }
};

export const usePatchBareMetalInstance = () => {
  const client = useApiFetch(BareMetalInstances);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (input: PatchBareMetalInstanceInput) =>
      client.update({ object: { id: input.id, ...buildPatchBody(input) } }).then((r) => r.object),
    onSuccess: () => invalidateBareMetalInstancesQueries(qc),
  });
};

export const useDeleteBareMetalInstance = () => {
  const client = useApiFetch(BareMetalInstances);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidateBareMetalInstancesQueries(qc),
  });
};

export const useCreateBareMetalInstance = () => {
  const client = useApiFetch(BareMetalInstances);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (bmi: MessageInitShape<typeof BareMetalInstanceSchema>) =>
      client.create({ object: bmi }).then((r) => r.object),
    onSuccess: () => invalidateBareMetalInstancesQueries(qc),
  });
};
