import type { CatalogProvisionWizardState } from './types';

/** Shared sizing for catalog wizard multiline fields (SSH key, user data, etc.). */
export const CATALOG_PROVISION_MULTILINE_TEXTAREA = {
  rows: 8,
  resizeOrientation: 'vertical' as const,
};

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
