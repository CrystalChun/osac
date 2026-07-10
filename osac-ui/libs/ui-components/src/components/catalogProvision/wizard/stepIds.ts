import { CatalogProvisionKind } from '../catalogFieldDefinition';

export const WIZARD_STEP_IDS = [
  'catalog',
  'general',
  'configuration',
  'networking',
  'review',
] as const;

export type WizardStepId = (typeof WIZARD_STEP_IDS)[number];

export const STEP_LABEL_KEYS: Record<WizardStepId, string> = {
  catalog: 'catalogProvision.steps.catalog.title',
  general: 'catalogProvision.steps.general.title',
  configuration: 'catalogProvision.steps.configuration.title',
  networking: 'catalogProvision.steps.networking.title',
  review: 'catalogProvision.steps.review.title',
};

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
