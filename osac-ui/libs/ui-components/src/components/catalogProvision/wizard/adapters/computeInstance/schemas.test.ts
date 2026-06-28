import { describe, expect, it } from 'vitest';

import { vmCatalogItem } from '../../../test/fixtures';
import { buildComputeInstanceWizardSchema } from './schemas';
import { validateWizardStepFields } from '../../validateStep';
import { WIZARD_STEP_FIELD_PATHS } from './fields';

const t = (key: string) => key;

describe('buildComputeInstanceWizardSchema', () => {
  it('requires catalog item on catalog step', () => {
    const schema = buildComputeInstanceWizardSchema(null, t);
    const errors = validateWizardStepFields(
      schema,
      {
        catalogItemId: '',
        metadata: { name: '' },
        spec: {
          sshKey: '',
          image: { sourceRef: '' },
          instanceType: '',
          userData: '',
          bootDisk: { sizeGib: '' },
          networking: { virtualNetworkId: '', subnetId: '', securityGroupIds: [] },
        },
      },
      WIZARD_STEP_FIELD_PATHS.catalog,
    );
    expect(errors).toEqual({ catalogItemId: 'catalogProvision.validation.catalogItemRequired' });
  });

  it('requires name on general step without blur', () => {
    const schema = buildComputeInstanceWizardSchema(null, t);
    const errors = validateWizardStepFields(
      schema,
      {
        catalogItemId: vmCatalogItem.id,
        metadata: { name: '   ' },
        spec: {
          sshKey: '',
          image: { sourceRef: '' },
          instanceType: '',
          userData: '',
          bootDisk: { sizeGib: '' },
          networking: { virtualNetworkId: '', subnetId: '', securityGroupIds: [] },
        },
      },
      WIZARD_STEP_FIELD_PATHS.general,
    );
    expect(errors).toEqual({ metadata: { name: 'catalogProvision.validation.nameRequired' } });
  });

  it('validates boot disk as numeric when present', () => {
    const schema = buildComputeInstanceWizardSchema(vmCatalogItem, t);
    const errors = validateWizardStepFields(
      schema,
      {
        catalogItemId: vmCatalogItem.id,
        metadata: { name: 'web-01' },
        spec: {
          sshKey: '',
          image: { sourceRef: 'quay.io/example/rhel9' },
          instanceType: '',
          userData: '',
          bootDisk: { sizeGib: 'not-a-number' },
          networking: { virtualNetworkId: 'vn-1', subnetId: 'subnet-1', securityGroupIds: ['sg-1'] },
        },
      },
      ['spec.bootDisk.sizeGib'],
    );
    expect(errors).toEqual({
      spec: { bootDisk: { sizeGib: 'catalogProvision.validation.bootDiskNumber' } },
    });
  });

  it('requires networking pickers on networking step', () => {
    const schema = buildComputeInstanceWizardSchema(vmCatalogItem, t);
    const errors = validateWizardStepFields(
      schema,
      {
        catalogItemId: vmCatalogItem.id,
        metadata: { name: 'web-01' },
        spec: {
          sshKey: '',
          image: { sourceRef: 'quay.io/example/rhel9' },
          instanceType: '',
          userData: '',
          bootDisk: { sizeGib: '' },
          networking: { virtualNetworkId: '', subnetId: '', securityGroupIds: [] },
        },
      },
      WIZARD_STEP_FIELD_PATHS.networking,
    );
    expect(errors).toEqual({
      spec: {
        networking: {
          virtualNetworkId: 'catalogProvision.validation.virtualNetworkRequired',
          subnetId: 'catalogProvision.validation.subnetRequired',
          securityGroupIds: 'catalogProvision.validation.securityGroupRequired',
        },
      },
    });
  });

  it('requires instance type and boot disk on configuration step', () => {
    const schema = buildComputeInstanceWizardSchema(vmCatalogItem, t);
    const errors = validateWizardStepFields(
      schema,
      {
        catalogItemId: vmCatalogItem.id,
        metadata: { name: 'web-01' },
        spec: {
          sshKey: '',
          image: { sourceRef: 'quay.io/example/rhel9' },
          instanceType: '',
          userData: '',
          bootDisk: { sizeGib: '' },
          networking: { virtualNetworkId: '', subnetId: '', securityGroupIds: [] },
        },
      },
      WIZARD_STEP_FIELD_PATHS.configuration,
    );
    expect(errors).toEqual({
      spec: {
        instanceType: 'catalogProvision.validation.instanceTypeRequired',
        bootDisk: { sizeGib: 'catalogProvision.validation.required' },
      },
    });
  });

  it('requires ssh key on general step when defined in catalog field_definitions', () => {
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
    const schema = buildComputeInstanceWizardSchema(catalogItem, t);
    const errors = validateWizardStepFields(
      schema,
      {
        catalogItemId: vmCatalogItem.id,
        metadata: { name: 'web-01' },
        spec: {
          sshKey: '',
          image: { sourceRef: '' },
          instanceType: '',
          userData: '',
          bootDisk: { sizeGib: '' },
          networking: { virtualNetworkId: '', subnetId: '', securityGroupIds: [] },
        },
      },
      WIZARD_STEP_FIELD_PATHS.general,
    );
    expect(errors).toEqual({
      spec: { sshKey: 'catalogProvision.validation.required' },
    });
  });

  it('requires user data on configuration step when defined in catalog field_definitions', () => {
    const catalogItem = {
      ...vmCatalogItem,
      fieldDefinitions: [
        ...(vmCatalogItem.fieldDefinitions ?? []),
        {
          path: 'spec.user_data',
          displayName: 'User data',
          editable: true,
        },
      ],
    };
    const schema = buildComputeInstanceWizardSchema(catalogItem, t);
    const errors = validateWizardStepFields(
      schema,
      {
        catalogItemId: vmCatalogItem.id,
        metadata: { name: 'web-01' },
        spec: {
          sshKey: '',
          image: { sourceRef: 'quay.io/example/rhel9' },
          instanceType: 'standard-4-8',
          userData: '',
          bootDisk: { sizeGib: '40' },
          networking: { virtualNetworkId: '', subnetId: '', securityGroupIds: [] },
        },
      },
      WIZARD_STEP_FIELD_PATHS.configuration,
    );
    expect(errors).toEqual({
      spec: { userData: 'catalogProvision.validation.required' },
    });
  });

  it('merges ssh_key validation_schema pattern from catalog field_definitions', () => {
    const catalogItem = {
      ...vmCatalogItem,
      fieldDefinitions: [
        ...(vmCatalogItem.fieldDefinitions ?? []),
        {
          path: 'ssh_key',
          displayName: 'SSH key',
          editable: true,
          validationSchema: { type: 'string', pattern: '^ssh-' },
        },
      ],
    };
    const schema = buildComputeInstanceWizardSchema(catalogItem, t);
    const errors = validateWizardStepFields(
      schema,
      {
        catalogItemId: vmCatalogItem.id,
        metadata: { name: 'web-01' },
        spec: {
          sshKey: 'not-an-ssh-key',
          image: { sourceRef: '' },
          instanceType: '',
          userData: '',
          bootDisk: { sizeGib: '' },
          networking: { virtualNetworkId: '', subnetId: '', securityGroupIds: [] },
        },
      },
      WIZARD_STEP_FIELD_PATHS.general,
    );
    expect(errors).toEqual({
      spec: { sshKey: 'SSH key must match pattern: ^ssh-' },
    });
  });

  it('merges ssh_key validation_schema from catalog field_definitions', () => {
    const catalogItem = {
      ...vmCatalogItem,
      fieldDefinitions: [
        ...(vmCatalogItem.fieldDefinitions ?? []),
        {
          path: 'ssh_key',
          displayName: 'SSH key',
          editable: true,
          validationSchema: { type: 'string', minLength: 10 },
        },
      ],
    };
    const schema = buildComputeInstanceWizardSchema(catalogItem, t);
    const errors = validateWizardStepFields(
      schema,
      {
        catalogItemId: vmCatalogItem.id,
        metadata: { name: 'web-01' },
        spec: {
          sshKey: 'short',
          image: { sourceRef: '' },
          instanceType: '',
          userData: '',
          bootDisk: { sizeGib: '' },
          networking: { virtualNetworkId: '', subnetId: '', securityGroupIds: [] },
        },
      },
      WIZARD_STEP_FIELD_PATHS.general,
    );
    expect(errors).toEqual({
      spec: { sshKey: 'spec.sshKey must be at least 10 characters' },
    });
  });
});
