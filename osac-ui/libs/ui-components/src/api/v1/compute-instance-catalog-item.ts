import {
  type ComputeInstanceCatalogItem,
  ComputeInstanceCatalogItemSchema,
  type ComputeInstanceCatalogItemsListResponse,
  ComputeInstanceCatalogItemsListResponseSchema,
} from '@osac/types';

import { useApiQuery } from '../use-api-query';

export type ListComputeInstanceCatalogItemsParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useComputeInstanceCatalogItems = (
  params: ListComputeInstanceCatalogItemsParams = {},
) =>
  useApiQuery<ComputeInstanceCatalogItemsListResponse, ComputeInstanceCatalogItem[]>({
    queryKey: ['v1/compute_instance_catalog_items', null, params],
    select: (data) => data.items.filter((item) => item.published),
    meta: { decode: ComputeInstanceCatalogItemsListResponseSchema },
  });

export const useComputeInstanceCatalogItem = (id: string | undefined) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<ComputeInstanceCatalogItem>({
    queryKey: ['v1/compute_instance_catalog_items', trimmedId ? [trimmedId] : null],
    meta: { decode: ComputeInstanceCatalogItemSchema },
    enabled: Boolean(trimmedId),
  });
};
