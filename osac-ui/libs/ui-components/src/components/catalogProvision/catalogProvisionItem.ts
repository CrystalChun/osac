import type { ClusterCatalogItem } from '@osac/types';

import type { CatalogItemForDisplay } from '../catalog/catalogItemDisplay';

/** Catalog item shape used by the provision wizard (wire JSON or test fixtures). */
export type CatalogProvisionCatalogItem = CatalogItemForDisplay & {
  template: string;
  published: boolean;
};

export const toCatalogProvisionCatalogItem = (
  item: CatalogItemForDisplay,
): CatalogProvisionCatalogItem => ({
  ...item,
  template: item.template ?? '',
  published: item.published ?? false,
});

export const clusterCatalogItemToProvisionItem = (
  item: ClusterCatalogItem,
): CatalogProvisionCatalogItem => ({
  id: item.id,
  title: item.title,
  description: item.description,
  template: item.template,
  published: item.published,
  metadata: item.metadata,
  fieldDefinitions: item.fieldDefinitions,
});
