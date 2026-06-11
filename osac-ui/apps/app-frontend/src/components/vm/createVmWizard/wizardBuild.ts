import type {
  ClusterTemplate,
  ComputeInstance,
  ComputeInstanceCatalogItem,
} from '@osac/api-contracts/types';
import { normalizeRunStrategyWire } from '@osac/api-contracts/computeInstanceNormalize';
import type { WizardState } from './types';
import {
  defaultTemplateBootDiskGib,
  parseTemplateAdditionalDisksGibInput,
  parseTemplateBootDiskGibInput,
  parseTemplateCoresInput,
  parseTemplateMemoryGibInput,
  parseTemplateSecurityGroupsInput,
} from './constants';

/** Client-side validation for a wizard step; returns field error map (empty when valid). */
export const validateWizardStep = (stepId: string, draft: WizardState): Record<string, string> => {
  switch (stepId) {
    case 'template':
      if (!draft.selectedCatalogItemId) {
        return { selectedCatalogItemId: 'Select a catalog item' };
      }
      return {};
    case 'customization': {
      const errors: Record<string, string> = {};
      if (!draft.templateVmName.trim()) {
        errors.templateVmName = 'Virtual machine name is required';
      }
      if (parseTemplateBootDiskGibInput(draft.templateBootDiskSizeGib) === null) {
        errors.templateBootDiskSizeGib = 'Enter a valid boot disk size (GiB)';
      }
      if (parseTemplateCoresInput(draft.templateCores) === null) {
        errors.templateCores = 'Enter a valid vCPU count';
      }
      if (parseTemplateMemoryGibInput(draft.templateMemoryGib) === null) {
        errors.templateMemoryGib = 'Enter a valid memory size (GiB)';
      }
      if (parseTemplateAdditionalDisksGibInput(draft.templateAdditionalDisksGibRaw) === null) {
        errors.templateAdditionalDisksGibRaw = 'Enter valid additional disk sizes (GiB)';
      }
      return errors;
    }
    default:
      return {};
  }
};

/** Validate all steps before finalize. */
export const validateWizardForFinalize = (draft: WizardState): Record<string, string> => {
  for (const stepId of ['template', 'customization']) {
    const errors = validateWizardStep(stepId, draft);
    if (Object.keys(errors).length > 0) {
      return errors;
    }
  }
  if (!draft.selectedCatalogItemId) {
    return { selectedCatalogItemId: 'Select a catalog item' };
  }
  return {};
};

/**
 * Build a partial ComputeInstance from the wizard draft for POST /compute_instances.
 * Uses `spec.catalog_item` (not `spec.template`). `template_parameters` is left empty for now.
 */
export const buildComputeInstanceFromWizardDraft = (
  draft: WizardState,
  catalogItem: ComputeInstanceCatalogItem | null | undefined,
  underlyingTemplate: ClusterTemplate | null | undefined,
): Partial<ComputeInstance> => {
  const template = underlyingTemplate ?? null;
  const cores = parseTemplateCoresInput(draft.templateCores) ?? template?.defaultCores ?? 2;
  const memoryGib =
    parseTemplateMemoryGibInput(draft.templateMemoryGib) ?? template?.defaultMemoryGib ?? 4;
  const bootDiskGib =
    parseTemplateBootDiskGibInput(draft.templateBootDiskSizeGib) ??
    defaultTemplateBootDiskGib(template);
  const additionalDisksGib =
    parseTemplateAdditionalDisksGibInput(draft.templateAdditionalDisksGibRaw) ?? [];
  const runStrategy =
    normalizeRunStrategyWire(draft.startAfterCreate ? 'Always' : draft.templateRunStrategy) ??
    'Halted';
  const securityGroups = parseTemplateSecurityGroupsInput(draft.templateSecurityGroupsRaw);

  const spec: ComputeInstance['spec'] = {
    catalogItem: catalogItem?.id ?? draft.selectedCatalogItemId ?? undefined,
    cores,
    memoryGib,
    bootDisk: { sizeGib: bootDiskGib },
    runStrategy,
  };

  if (additionalDisksGib.length > 0) {
    spec.additionalDisks = additionalDisksGib.map((sizeGib) => ({ sizeGib }));
  }
  if (draft.templateSubnetId.trim()) {
    spec.subnet = draft.templateSubnetId.trim();
  }
  if (securityGroups.length > 0) {
    spec.securityGroups = securityGroups;
  }
  if (draft.templateSshPublicKey.trim()) {
    spec.sshKey = draft.templateSshPublicKey.trim();
  }
  if (draft.templateUserData.trim()) {
    spec.userData = draft.templateUserData.trim();
  }
  if (draft.templateImageSourceType.trim() && draft.templateImageSourceRef.trim()) {
    spec.image = {
      source_type: draft.templateImageSourceType.trim(),
      source_ref: draft.templateImageSourceRef.trim(),
    };
  }

  return {
    metadata: { name: draft.templateVmName.trim() },
    spec,
  };
};
