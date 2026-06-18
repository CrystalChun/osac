import type { ComputeInstanceCatalogItem } from '@osac/types';
import type { BuildComputeInstanceCreateBodyInput } from '@osac/ui-components/api/v1/compute-instance-wire';

import {
  type CatalogFieldDefinition,
  type CatalogProvisionKind,
  type WizardComputeInstanceSpec,
  applyFieldDefinitionsToSpec,
  buildNetworkAttachmentsFromRows,
  configurationFieldsExcludingNetwork,
  getNetworkAttachmentFieldBundle,
  hasEditableNetworkAttachmentFields,
  partitionFieldDefinitions,
  readCatalogItemFieldDefinitions,
  seedFieldValuesFromCatalogItem,
  seedNetworkAttachmentRowsFromCatalogItem,
  validateCatalogFieldInput,
} from '../catalogFieldDefinition';
import type { CatalogProvisionCatalogItem } from '../catalogProvisionItem';
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
  catalogItem: CatalogProvisionCatalogItem | null | undefined,
): Record<string, string> => {
  const bundle = getNetworkAttachmentFieldBundle(readCatalogItemFieldDefinitions(catalogItem));
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
  catalogItem: CatalogProvisionCatalogItem | null | undefined,
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
      const { basics } = partitionFieldDefinitions(
        readCatalogItemFieldDefinitions(catalogItem),
        kind,
      );
      Object.assign(errors, validateFieldDefinitions(basics, draft.fieldValues));
      return errors;
    }
    case 'configuration': {
      if (!catalogItem) {
        return {};
      }
      const { configuration } = partitionFieldDefinitions(
        readCatalogItemFieldDefinitions(catalogItem),
        kind,
      );
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
  catalogItem: CatalogProvisionCatalogItem | null | undefined,
  kind: CatalogProvisionKind,
  orderedSteps: readonly string[],
): Record<string, string> => {
  if (!draft.catalogItemId || !catalogItem) {
    return { catalogItemId: 'Select a catalog item' };
  }

  for (const stepId of orderedSteps) {
    if (stepId === 'review') {
      continue;
    }
    const errors = validateWizardStep(stepId, draft, catalogItem, kind);
    if (Object.keys(errors).length > 0) {
      return errors;
    }
  }
  return {};
};

/** True when the active wizard step (or full wizard on review) passes validation. */
export const canProceedWizardStep = (
  activeStepId: string,
  draft: CatalogProvisionWizardState,
  catalogItem: CatalogProvisionCatalogItem | null | undefined,
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
  catalogItem: CatalogProvisionCatalogItem | null | undefined,
  kind: CatalogProvisionKind,
): Record<string, string> => {
  if (activeStepId === 'review' || activeStepId === 'catalog') {
    return {};
  }
  return validateWizardStep(activeStepId, draft, catalogItem, kind);
};

export const buildComputeInstanceFromWizardDraft = (
  draft: CatalogProvisionWizardState,
  catalogItem: ComputeInstanceCatalogItem | CatalogProvisionCatalogItem,
): BuildComputeInstanceCreateBodyInput => {
  const spec: WizardComputeInstanceSpec = { catalogItem: catalogItem.id };
  const networkBundle = getNetworkAttachmentFieldBundle(
    readCatalogItemFieldDefinitions(catalogItem),
  );
  const useNetworkRows = hasEditableNetworkAttachmentFields(networkBundle);

  applyFieldDefinitionsToSpec(
    spec,
    readCatalogItemFieldDefinitions(catalogItem) ?? [],
    draft.fieldValues,
    {
      skipNetworkAttachmentFields: useNetworkRows,
    },
  );

  if (useNetworkRows) {
    const attachments = buildNetworkAttachmentsFromRows(draft.networkAttachmentRows);
    if (attachments?.length) {
      spec.networkAttachments = attachments;
    }
  }

  return {
    metadata: { name: draft.resourceName.trim() },
    spec: spec as BuildComputeInstanceCreateBodyInput['spec'],
  };
};

export { seedFieldValuesFromCatalogItem, seedNetworkAttachmentRowsFromCatalogItem };
