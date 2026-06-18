import type { NetworkAttachmentRowInput } from '../catalogFieldDefinition';
import type { CatalogProvisionKind } from '../catalogFieldDefinition';

export interface CatalogProvisionWizardState {
  catalogItemId: string | null;
  resourceName: string;
  fieldValues: Record<string, string>;
  networkAttachmentRows: NetworkAttachmentRowInput[];
}

export type UpdateFieldValueFn = (path: string, value: string) => void;

export type UpdateDraftFn = <K extends keyof CatalogProvisionWizardState>(
  key: K,
  value: CatalogProvisionWizardState[K],
) => void;

export type CatalogProvisionWizardKind = CatalogProvisionKind;
