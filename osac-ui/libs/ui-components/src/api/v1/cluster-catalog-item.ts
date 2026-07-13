import {
  type ClusterCatalogItem,
  ClusterCatalogItemSchema,
  type ClusterCatalogItemsListResponse,
  ClusterCatalogItemsListResponseSchema,
} from '@osac/types';

import { useApiQuery } from '../use-api-query';

export type ListClusterCatalogItemsParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useClusterCatalogItems = (
  params: ListClusterCatalogItemsParams = {},
  enabled = true,
) =>
  useApiQuery<ClusterCatalogItemsListResponse, ClusterCatalogItem[]>({
    queryKey: ['v1/cluster_catalog_items', null, params],
    select: (data) => data.items,
    meta: { decode: ClusterCatalogItemsListResponseSchema },
    enabled,
  });

export const useClusterCatalogItem = (id: string | undefined) => {
  return useApiQuery<ClusterCatalogItem>({
    queryKey: ['v1/cluster_catalog_items', id ? [id] : null],
    meta: { decode: ClusterCatalogItemSchema },
    enabled: Boolean(id),
  });
};
