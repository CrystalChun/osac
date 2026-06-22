import type { CatalogProvisionKind } from '../catalogFieldDefinition';
import { shouldIncludeConfigurationStep } from '../catalogFieldDefinition';
import type { CatalogProvisionCatalogItem } from '../catalogProvisionItem';

export const STEP_LABELS: Record<string, string> = {
  catalog: 'Catalog',
  basics: 'Basics',
  configuration: 'Configuration',
  review: 'Review',
};

export const getWizardOrderedSteps = (
  catalogItem: CatalogProvisionCatalogItem | null | undefined,
  kind: CatalogProvisionKind,
): readonly string[] => {
  const steps = ['catalog', 'basics'] as string[];
  if (shouldIncludeConfigurationStep(catalogItem, kind)) {
    steps.push('configuration');
  }
  steps.push('review');
  return steps;
};
