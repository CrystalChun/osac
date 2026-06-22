import type { CatalogProvisionWizardState } from './types';

export const INITIAL_STATE: CatalogProvisionWizardState = {
  catalogItemId: null,
  resourceName: '',
  fieldValues: {},
  networkAttachmentRows: [],
};

export const mergeWizardDraft = (
  patch: Partial<CatalogProvisionWizardState>,
): CatalogProvisionWizardState => ({
  ...INITIAL_STATE,
  ...patch,
  fieldValues: {
    ...INITIAL_STATE.fieldValues,
    ...(patch.fieldValues ?? {}),
  },
  networkAttachmentRows: patch.networkAttachmentRows ?? INITIAL_STATE.networkAttachmentRows,
});

export const hasWizardUnsavedProgress = (draft: CatalogProvisionWizardState): boolean => {
  return Boolean(draft.catalogItemId?.trim());
};
