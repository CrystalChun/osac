import type {
  ComputeInstanceCatalogItem,
  ComputeInstanceCatalogItemsListResponse,
} from '@osac/types';

import { useApiQuery } from '../use-api-query';

export type ListComputeInstanceCatalogItemsParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useComputeInstanceCatalogItems = (
  params: ListComputeInstanceCatalogItemsParams = {},
) => {
  return useApiQuery<ComputeInstanceCatalogItemsListResponse, ComputeInstanceCatalogItem[]>({
    queryKey: ['v1/compute_instance_catalog_items', null, params],
    select: (data) => data.items.filter((item) => item.published),
  });
};

export const useComputeInstanceCatalogItem = (id: string) => {
  return useApiQuery<ComputeInstanceCatalogItem>({
    queryKey: ['v1/compute_instance_catalog_items', [id]],
  });
};
