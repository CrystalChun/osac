import { TFunction } from 'i18next';

import { CatalogProvisionKind } from '../catalogFieldDefinition';

export const WIZARD_STEP_IDS = ['catalog', 'general', 'configuration', 'networking', 'review'];

export type WizardStepId = (typeof WIZARD_STEP_IDS)[number];

export const STEP_LABEL_KEYS = (t: TFunction): Record<WizardStepId, string> => ({
  catalog: t('Catalog item'),
  general: t('General'),
  configuration: t('Configuration'),
  networking: t('Networking'),
  review: t('Review'),
});

const BARE_METAL_WIZARD_STEPS: readonly WizardStepId[] = [
  'catalog',
  'general',
  'configuration',
  'review',
];

export const getWizardOrderedSteps = (kind?: CatalogProvisionKind): readonly WizardStepId[] => {
  if (kind === 'bare_metal_instance') {
    return BARE_METAL_WIZARD_STEPS;
  }
  return WIZARD_STEP_IDS;
};
