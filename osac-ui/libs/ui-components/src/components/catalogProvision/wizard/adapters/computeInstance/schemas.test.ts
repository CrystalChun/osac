import { describe, expect, it } from 'vitest';
import { ValidationError } from 'yup';

import type { ComputeInstanceWizardValues } from './fields';
import { EMPTY_LABELED_RESOURCE_REF } from './fields';
import { buildComputeInstanceStepSchema } from './schemas';
import { vmCatalogItem } from '../../../test/fixtures';

const t = (key: string) => key;

const emptyValues: ComputeInstanceWizardValues = {
  catalogItemId: '',
  metadata: { name: '' },
  spec: {
    sshKey: '',
    image: { sourceRef: '' },
    instanceType: EMPTY_LABELED_RESOURCE_REF,
    userData: '',
    bootDisk: { sizeGib: '' },
    networking: {
      virtualNetwork: EMPTY_LABELED_RESOURCE_REF,
      subnet: EMPTY_LABELED_RESOURCE_REF,
      securityGroups: [],
    },
  },
};

const validateStep = async (
  stepId: Parameters<typeof buildComputeInstanceStepSchema>[1],
  values: ComputeInstanceWizardValues,
  catalogItem: unknown = null,
) => {
  const schema = buildComputeInstanceStepSchema(catalogItem, stepId, t);
  if (!schema) {
    return {};
  }
  try {
    await schema.validate(values, { abortEarly: false });
    return {};
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw error;
    }
    const errors: Record<string, unknown> = {};
    for (const inner of error.inner.length > 0 ? error.inner : [error]) {
      if (!inner.path) {
        continue;
      }
      const parts = inner.path.split('.');
      let current: Record<string, unknown> = errors;
      for (let index = 0; index < parts.length - 1; index += 1) {
        const key = parts[index];
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = inner.message;
    }
    return errors;
  }
};

describe('buildComputeInstanceStepSchema', () => {
  it('requires catalog item on catalog step', async () => {
    const errors = await validateStep('catalog', emptyValues);
    expect(errors).toEqual({ catalogItemId: 'catalogProvision.validation.catalogItemRequired' });
  });

  it('requires name on general step without validating configuration fields', async () => {
    const errors = await validateStep('general', {
      ...emptyValues,
      catalogItemId: vmCatalogItem.id,
      metadata: { name: '   ' },
    });
    expect(errors).toEqual({ metadata: { name: 'catalogProvision.validation.nameRequired' } });
  });

  it('validates boot disk as numeric on configuration step only', async () => {
    const errors = await validateStep(
      'configuration',
      {
        ...emptyValues,
        catalogItemId: vmCatalogItem.id,
        metadata: { name: 'web-01' },
        spec: {
          ...emptyValues.spec,
          image: { sourceRef: 'quay.io/example/rhel9' },
          instanceType: { value: 'standard-4-8', label: 'standard-4-8' },
          bootDisk: { sizeGib: 'not-a-number' },
        },
      },
      vmCatalogItem,
    );
    expect(errors).toEqual({
      spec: { bootDisk: { sizeGib: 'catalogProvision.validation.bootDiskNumber' } },
    });
  });

  it('requires networking pickers on networking step', async () => {
    const errors = await validateStep(
      'networking',
      {
        ...emptyValues,
        catalogItemId: vmCatalogItem.id,
        metadata: { name: 'web-01' },
        spec: {
          ...emptyValues.spec,
          image: { sourceRef: 'quay.io/example/rhel9' },
        },
      },
      vmCatalogItem,
    );
    expect(errors).toEqual({
      spec: {
        networking: {
          virtualNetwork: 'catalogProvision.validation.virtualNetworkRequired',
          subnet: 'catalogProvision.validation.subnetRequired',
          securityGroups: 'catalogProvision.validation.securityGroupRequired',
        },
      },
    });
  });

  it('requires instance type and boot disk on configuration step', async () => {
    const errors = await validateStep(
      'configuration',
      {
        ...emptyValues,
        catalogItemId: vmCatalogItem.id,
        metadata: { name: 'web-01' },
        spec: {
          ...emptyValues.spec,
          image: { sourceRef: 'quay.io/example/rhel9' },
        },
      },
      vmCatalogItem,
    );
    expect(errors).toEqual({
      spec: {
        instanceType: 'catalogProvision.validation.instanceTypeRequired',
        bootDisk: { sizeGib: 'catalogProvision.validation.required' },
      },
    });
  });

  it('requires ssh key on general step when defined in catalog field_definitions', async () => {
    const catalogItem = {
      ...vmCatalogItem,
      fieldDefinitions: [
        ...(vmCatalogItem.fieldDefinitions ?? []),
        {
          path: 'ssh_key',
          displayName: 'SSH key',
          editable: true,
        },
      ],
    };
    const errors = await validateStep(
      'general',
      {
        ...emptyValues,
        catalogItemId: vmCatalogItem.id,
        metadata: { name: 'web-01' },
      },
      catalogItem,
    );
    expect(errors).toEqual({
      spec: { sshKey: 'catalogProvision.validation.required' },
    });
  });

  it('returns undefined for review step', () => {
    expect(buildComputeInstanceStepSchema(vmCatalogItem, 'review', t)).toBeUndefined();
  });
});
