import type { CatalogItemBase, CatalogProvisionKind } from '@osac/api-contracts/types';
import type { CatalogProvisionWizardState } from '../types';

export interface CatalogItemsQueryResult<TItem extends CatalogItemBase> {
  data: TItem[];
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
}

export interface CatalogProvisionAdapter<TItem extends CatalogItemBase, TPayload> {
  kind: CatalogProvisionKind;
  useCatalogItems: () => CatalogItemsQueryResult<TItem>;
  buildCreatePayload: (draft: CatalogProvisionWizardState, item: TItem) => Partial<TPayload>;
  createButtonLabel: string;
  wizardTitle: string;
  wizardDescription: string;
  resourceNameLabel: string;
  ariaLabel: string;
}
