import type { CatalogItemForDisplay } from '../vm/catalogItemDisplay';

/** Catalog item shape used by the provision wizard (wire JSON or test fixtures). */
export type CatalogProvisionCatalogItem = CatalogItemForDisplay & {
  template: string;
  published: boolean;
};
