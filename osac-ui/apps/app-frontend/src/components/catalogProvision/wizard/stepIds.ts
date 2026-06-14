import type { CatalogItemBase } from '@osac/api-contracts/types';
import { shouldIncludeConfigurationStep } from '@osac/api-contracts/catalogFieldDefinition';
import type { CatalogProvisionKind } from '@osac/api-contracts/types';

export const WIZARD_STEP_IDS = ['catalog', 'basics', 'configuration', 'review'] as const;
export type WizardStepId = (typeof WIZARD_STEP_IDS)[number];

export const getWizardOrderedSteps = (
  catalogItem: CatalogItemBase | null | undefined,
  kind: CatalogProvisionKind,
): WizardStepId[] => {
  const steps: WizardStepId[] = ['catalog', 'basics'];
  if (shouldIncludeConfigurationStep(catalogItem, kind)) {
    steps.push('configuration');
  }
  steps.push('review');
  return steps;
};

export const STEP_LABELS: Record<WizardStepId, string> = {
  catalog: 'Catalog item',
  basics: 'Basics',
  configuration: 'Configuration',
  review: 'Review',
};
