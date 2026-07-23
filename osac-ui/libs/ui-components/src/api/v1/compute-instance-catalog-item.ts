import { useMutation } from '@tanstack/react-query';

import { ComputeInstanceCatalogItems } from '@osac/types';
import { ComputeInstanceCatalogItems as PrivateComputeInstanceCatalogItems } from '@osac/types/private';

import { useSession } from '../../hooks/use-session';
import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export const useComputeInstanceCatalogItems = (params: ListParams = {}, enabled = true) => {
  const client = useApiFetch(ComputeInstanceCatalogItems);
  return useApiQuery({
    queryKey: apiQueryKey('v1/compute_instance_catalog_items', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled,
  });
};

export const useComputeInstanceCatalogItem = (id: string | undefined) => {
  const client = useApiFetch(ComputeInstanceCatalogItems);
  const trimmedId = id?.trim() ?? '';
  return useApiQuery({
    queryKey: apiQueryKey('v1/compute_instance_catalog_items', trimmedId ? [trimmedId] : undefined),
    queryFn: () => client.get({ id: trimmedId }),
    select: (data) => data.object,
    enabled: Boolean(trimmedId),
  });
};

/**
 * Admin list hook for the catalog management pages. CSP Admin (`providerAdmin`) sees all items via
 * the private API (including unpublished); Tenant Admin sees their tenant's items via the public API,
 * which the server already scopes to the caller's tenant regardless of publication status.
 */
export const useAdminComputeInstanceCatalogItems = (params: ListParams = {}, enabled = true) => {
  const { role } = useSession();
  const isProviderAdmin = role === 'providerAdmin';
  const publicResult = useComputeInstanceCatalogItems(params, enabled && !isProviderAdmin);
  const privateClient = useApiFetch(PrivateComputeInstanceCatalogItems);
  const privateResult = useApiQuery({
    queryKey: apiQueryKey('v1/compute_instance_catalog_items_private', undefined, params),
    queryFn: () => privateClient.list(params),
    select: (data) => data.items,
    enabled: enabled && isProviderAdmin,
  });
  return isProviderAdmin ? privateResult : publicResult;
};

export const useAdminSetComputeInstanceCatalogItemPublished = () => {
  const { role } = useSession();
  const isProviderAdmin = role === 'providerAdmin';
  const publicClient = useApiFetch(ComputeInstanceCatalogItems);
  const privateClient = useApiFetch(PrivateComputeInstanceCatalogItems);
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
            ? 'v1/compute_instance_catalog_items_private'
            : 'v1/compute_instance_catalog_items',
        ),
      }),
  });
};
