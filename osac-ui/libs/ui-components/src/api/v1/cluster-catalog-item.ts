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

export const useClusterCatalogItems = (params: ListClusterCatalogItemsParams = {}) =>
  useApiQuery<ClusterCatalogItemsListResponse, ClusterCatalogItem[]>({
    queryKey: ['v1/cluster_catalog_items', null, params],
    select: (data) => data.items.filter((item) => item.published),
    meta: { decode: ClusterCatalogItemsListResponseSchema },
  });

export const useClusterCatalogItem = (id: string | undefined) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<ClusterCatalogItem>({
    queryKey: ['v1/cluster_catalog_items', trimmedId ? [trimmedId] : null],
    meta: { decode: ClusterCatalogItemSchema },
    enabled: Boolean(trimmedId),
  });
};
