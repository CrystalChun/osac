import type {
  CatalogFieldDefinition,
  CatalogItemBase,
  CatalogProvisionKind,
  ComputeInstance,
  ComputeInstanceCatalogItem,
} from '@osac/api-contracts/types';
import {
  applyFieldDefinitionsToSpec,
  buildNetworkAttachmentsFromRows,
  configurationFieldsExcludingNetwork,
  getNetworkAttachmentFieldBundle,
  hasEditableNetworkAttachmentFields,
  parseSecurityGroupsRaw,
  partitionFieldDefinitions,
  validateCatalogFieldInput,
} from '@osac/api-contracts/catalogFieldDefinition';
import type { ComputeInstanceSpec } from '@osac/api-contracts/types';
import type { CatalogProvisionWizardState } from './types';

export const wizardCatalogFieldErrorKey = (path: string): string => `catalogField:${path}`;

export const wizardNetworkAttachmentErrorKey = (
  index: number,
  field: 'subnet' | 'security_groups',
): string => `networkAttachment:${index}:${field}`;

const validateFieldDefinitions = (
  definitions: CatalogFieldDefinition[],
  fieldValues: Record<string, string>,
): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const def of definitions) {
    const err = validateCatalogFieldInput(def, fieldValues[def.path] ?? '');
    if (err) {
      errors[wizardCatalogFieldErrorKey(def.path)] = err;
    }
  }
  return errors;
};

const validateNetworkAttachmentRows = (
  draft: CatalogProvisionWizardState,
  catalogItem: CatalogItemBase | null | undefined,
): Record<string, string> => {
  const bundle = getNetworkAttachmentFieldBundle(catalogItem?.fieldDefinitions);
  if (!hasEditableNetworkAttachmentFields(bundle)) {
    return {};
  }

  const errors: Record<string, string> = {};
  const rows =
    draft.networkAttachmentRows.length > 0
      ? draft.networkAttachmentRows
      : [{ subnet: '', securityGroupsRaw: '' }];

  rows.forEach((row, index) => {
    if (bundle.subnetDef) {
      const err = validateCatalogFieldInput(bundle.subnetDef, row.subnet);
      if (err) {
        errors[wizardNetworkAttachmentErrorKey(index, 'subnet')] = err;
      } else if (
        bundle.securityGroupsDef &&
        parseSecurityGroupsRaw(row.securityGroupsRaw).length > 0 &&
        !row.subnet.trim()
      ) {
        errors[wizardNetworkAttachmentErrorKey(index, 'subnet')] =
          `${bundle.subnetDef.displayName} is required when security groups are set.`;
      }
    }
    if (bundle.securityGroupsDef) {
      const err = validateCatalogFieldInput(bundle.securityGroupsDef, row.securityGroupsRaw);
      if (err) {
        errors[wizardNetworkAttachmentErrorKey(index, 'security_groups')] = err;
      }
    }
  });

  return errors;
};

export const validateWizardStep = (
  stepId: string,
  draft: CatalogProvisionWizardState,
  catalogItem: CatalogItemBase | null | undefined,
  kind: CatalogProvisionKind,
): Record<string, string> => {
  switch (stepId) {
    case 'catalog':
      if (!draft.catalogItemId) {
        return { catalogItemId: 'Select a catalog item' };
      }
      return {};
    case 'basics': {
      const errors: Record<string, string> = {};
      if (!draft.resourceName.trim()) {
        errors.resourceName = 'Name is required';
      }
      const { basics } = partitionFieldDefinitions(catalogItem?.fieldDefinitions, kind);
      Object.assign(errors, validateFieldDefinitions(basics, draft.fieldValues));
      return errors;
    }
    case 'configuration': {
      if (!catalogItem) {
        return {};
      }
      const { configuration } = partitionFieldDefinitions(catalogItem.fieldDefinitions, kind);
      const otherConfiguration = configurationFieldsExcludingNetwork(configuration);
      const errors = validateFieldDefinitions(otherConfiguration, draft.fieldValues);
      Object.assign(errors, validateNetworkAttachmentRows(draft, catalogItem));
      return errors;
    }
    default:
      return {};
  }
};

export const validateWizardForFinalize = (
  draft: CatalogProvisionWizardState,
  catalogItem: CatalogItemBase | null | undefined,
  kind: CatalogProvisionKind,
  orderedSteps: readonly string[],
): Record<string, string> => {
  for (const stepId of orderedSteps) {
    if (stepId === 'review') {
      continue;
    }
    const errors = validateWizardStep(stepId, draft, catalogItem, kind);
    if (Object.keys(errors).length > 0) {
      return errors;
    }
  }
  if (!draft.catalogItemId) {
    return { catalogItemId: 'Select a catalog item' };
  }
  return {};
};

/** True when the active wizard step (or full wizard on review) passes validation. */
export const canProceedWizardStep = (
  activeStepId: string,
  draft: CatalogProvisionWizardState,
  catalogItem: CatalogItemBase | null | undefined,
  kind: CatalogProvisionKind,
  orderedSteps: readonly string[],
): boolean => {
  if (activeStepId === 'review') {
    return (
      Object.keys(validateWizardForFinalize(draft, catalogItem, kind, orderedSteps)).length === 0
    );
  }
  if (activeStepId === 'catalog') {
    return Boolean(draft.catalogItemId);
  }
  return Object.keys(validateWizardStep(activeStepId, draft, catalogItem, kind)).length === 0;
};

export const liveWizardStepFieldErrors = (
  activeStepId: string,
  draft: CatalogProvisionWizardState,
  catalogItem: CatalogItemBase | null | undefined,
  kind: CatalogProvisionKind,
): Record<string, string> => {
  if (activeStepId === 'review' || activeStepId === 'catalog') {
    return {};
  }
  return validateWizardStep(activeStepId, draft, catalogItem, kind);
};

export const buildComputeInstanceFromWizardDraft = (
  draft: CatalogProvisionWizardState,
  catalogItem: ComputeInstanceCatalogItem,
): Partial<ComputeInstance> => {
  const spec: ComputeInstanceSpec = { catalogItem: catalogItem.id };
  const networkBundle = getNetworkAttachmentFieldBundle(catalogItem.fieldDefinitions);
  const useNetworkRows = hasEditableNetworkAttachmentFields(networkBundle);

  applyFieldDefinitionsToSpec(spec, catalogItem.fieldDefinitions ?? [], draft.fieldValues, {
    skipNetworkAttachmentFields: useNetworkRows,
  });

  if (useNetworkRows) {
    const attachments = buildNetworkAttachmentsFromRows(draft.networkAttachmentRows);
    if (attachments?.length) {
      spec.networkAttachments = attachments;
    }
  }

  return {
    metadata: { name: draft.resourceName.trim() },
    spec,
  };
};

export {
  seedFieldValuesFromCatalogItem,
  seedNetworkAttachmentRowsFromCatalogItem,
} from '@osac/api-contracts/catalogFieldDefinition';
