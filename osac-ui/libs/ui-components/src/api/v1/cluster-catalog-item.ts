import { useMutation } from '@tanstack/react-query';

import { ClusterCatalogItems } from '@osac/types';
import { ClusterCatalogItems as PrivateClusterCatalogItems } from '@osac/types/private';

import { useSession } from '../../hooks/use-session';
import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export const useClusterCatalogItems = (params: ListParams = {}, enabled = true) => {
  const client = useApiFetch(ClusterCatalogItems);
  return useApiQuery({
    queryKey: apiQueryKey('v1/cluster_catalog_items', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled,
  });
};

export const useClusterCatalogItem = (id: string | undefined) => {
  const client = useApiFetch(ClusterCatalogItems);
  return useApiQuery({
    queryKey: apiQueryKey('v1/cluster_catalog_items', id ? [id] : undefined),
    queryFn: () => client.get({ id: id ?? '' }),
    select: (data) => data.object,
    enabled: Boolean(id),
  });
};

/**
 * Admin list hook for the catalog management pages. CSP Admin (`providerAdmin`) sees all items via
 * the private API (including unpublished); Tenant Admin sees their tenant's items via the public API,
 * which the server already scopes to the caller's tenant regardless of publication status.
 */
export const useAdminClusterCatalogItems = (params: ListParams = {}, enabled = true) => {
  const { role } = useSession();
  const isProviderAdmin = role === 'providerAdmin';
  const publicResult = useClusterCatalogItems(params, enabled && !isProviderAdmin);
  const privateClient = useApiFetch(PrivateClusterCatalogItems);
  const privateResult = useApiQuery({
    queryKey: apiQueryKey('v1/cluster_catalog_items_private', undefined, params),
    queryFn: () => privateClient.list(params),
    select: (data) => data.items,
    enabled: enabled && isProviderAdmin,
  });
  return isProviderAdmin ? privateResult : publicResult;
};

export const useAdminSetClusterCatalogItemPublished = () => {
  const { role } = useSession();
  const isProviderAdmin = role === 'providerAdmin';
  const publicClient = useApiFetch(ClusterCatalogItems);
  const privateClient = useApiFetch(PrivateClusterCatalogItems);
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
          isProviderAdmin ? 'v1/cluster_catalog_items_private' : 'v1/cluster_catalog_items',
        ),
      }),
  });
};
