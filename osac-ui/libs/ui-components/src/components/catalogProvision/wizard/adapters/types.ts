import type { CatalogProvisionKind } from '../../catalogFieldDefinition';
import type { CatalogProvisionCatalogItem } from '../../catalogProvisionItem';
import type { CatalogProvisionWizardState } from '../types';

export interface CatalogItemsQueryResult<TItem extends CatalogProvisionCatalogItem> {
  data: TItem[];
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
}

export interface CatalogProvisionAdapter<TItem extends CatalogProvisionCatalogItem, TPayload> {
  kind: CatalogProvisionKind;
  useCatalogItems: () => CatalogItemsQueryResult<TItem>;
  buildCreatePayload: (draft: CatalogProvisionWizardState, item: TItem) => Partial<TPayload>;
  createButtonLabel: string;
  wizardTitle: string;
  wizardDescription: string;
  resourceNameLabel: string;
  ariaLabel: string;
}
