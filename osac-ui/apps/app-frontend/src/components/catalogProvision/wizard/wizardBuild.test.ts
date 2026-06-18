import { describe, expect, it } from 'vitest';

import type { CatalogProvisionCatalogItem } from '../catalogProvisionItem';
import { INITIAL_STATE } from './constants';
import { getWizardOrderedSteps } from './stepIds';
import {
  buildComputeInstanceFromWizardDraft,
  canProceedWizardStep,
  liveWizardStepFieldErrors,
  seedFieldValuesFromCatalogItem,
  validateWizardForFinalize,
  validateWizardStep,
} from './wizardBuild';

const catalogWithFieldDefs: CatalogProvisionCatalogItem = {
  id: 'catalog-rhel-9',
  metadata: { name: 'catalog-rhel-9' },
  title: 'RHEL 9 catalog',
  template: 'tpl-rhel-9',
  published: true,
  fieldDefinitions: [
    {
      path: 'cores',
      displayName: 'vCPUs',
      editable: true,
      default: 4,
      validationSchema: { type: 'integer', minimum: 2, maximum: 32 },
    },
    {
      path: 'memory_gib',
      displayName: 'RAM (GiB)',
      editable: false,
      default: 8,
      validationSchema: { type: 'integer', minimum: 4, maximum: 128 },
    },
    {
      path: 'boot_disk.size_gib',
      displayName: 'Boot disk (GiB)',
      editable: true,
      default: 40,
      validationSchema: { type: 'integer', minimum: 20, maximum: 1024 },
    },
    {
      path: 'run_strategy',
      displayName: 'Run strategy',
      editable: true,
      default: 'Halted',
      validationSchema: { type: 'string', enum: ['Always', 'Halted'] },
    },
    {
      path: 'subnet',
      displayName: 'Subnet',
      editable: true,
      validationSchema: {
        type: 'string',
        enum: ['550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001'],
      },
    },
    {
      path: 'security_groups',
      displayName: 'Security groups',
      editable: true,
    },
    {
      path: 'ssh_key',
      displayName: 'SSH public key',
      editable: true,
    },
  ],
};

describe('getWizardOrderedSteps', () => {
  it('includes configuration when editable non-basics fields exist', () => {
    expect(getWizardOrderedSteps(catalogWithFieldDefs, 'compute_instance')).toEqual([
      'catalog',
      'basics',
      'configuration',
      'review',
    ]);
  });

  it('includes configuration before a catalog item is selected', () => {
    expect(getWizardOrderedSteps(null, 'compute_instance')).toEqual([
      'catalog',
      'basics',
      'configuration',
      'review',
    ]);
  });

  it('omits configuration when only basics fields are editable', () => {
    const item: CatalogProvisionCatalogItem = {
      ...catalogWithFieldDefs,
      fieldDefinitions: [
        {
          path: 'ssh_key',
          displayName: 'SSH public key',
          editable: true,
        },
        {
          path: 'memory_gib',
          displayName: 'RAM (GiB)',
          editable: false,
          default: 8,
        },
      ],
    };
    expect(getWizardOrderedSteps(item, 'compute_instance')).toEqual([
      'catalog',
      'basics',
      'review',
    ]);
  });
});

describe('validateWizardStep', () => {
  it('requires a catalog item on the catalog step (finalize only)', () => {
    expect(validateWizardStep('catalog', INITIAL_STATE, null, 'compute_instance')).toEqual({
      catalogItemId: 'Select a catalog item',
    });
  });

  it('does not surface catalog step errors in live field errors', () => {
    expect(liveWizardStepFieldErrors('catalog', INITIAL_STATE, null, 'compute_instance')).toEqual(
      {},
    );
  });

  it('disables proceed on catalog until an item is selected', () => {
    expect(
      canProceedWizardStep('catalog', INITIAL_STATE, null, 'compute_instance', [
        'catalog',
        'basics',
        'review',
      ]),
    ).toBe(false);
    expect(
      canProceedWizardStep(
        'catalog',
        { ...INITIAL_STATE, catalogItemId: 'item-1' },
        null,
        'compute_instance',
        ['catalog', 'basics', 'review'],
      ),
    ).toBe(true);
  });

  it('requires resource name on basics', () => {
    expect(
      validateWizardStep(
        'basics',
        { ...INITIAL_STATE, catalogItemId: 'catalog-rhel-9' },
        catalogWithFieldDefs,
        'compute_instance',
      ),
    ).toEqual({ resourceName: 'Name is required' });
  });

  it('validates configuration using catalog field definition JSON schema', () => {
    const errors = validateWizardStep(
      'configuration',
      {
        ...INITIAL_STATE,
        catalogItemId: 'catalog-rhel-9',
        resourceName: 'web-01',
        fieldValues: {
          cores: '1',
          memory_gib: '8',
          'boot_disk.size_gib': '64',
          run_strategy: 'Halted',
        },
      },
      catalogWithFieldDefs,
      'compute_instance',
    );
    expect(errors['catalogField:cores']).toMatch(/vCPUs must be between 2 and 32/);
  });

  it('does not require empty network attachment rows on configuration', () => {
    const errors = validateWizardStep(
      'configuration',
      {
        ...INITIAL_STATE,
        catalogItemId: 'catalog-rhel-9',
        resourceName: 'web-01',
        fieldValues: {
          cores: '4',
          'boot_disk.size_gib': '64',
          run_strategy: 'Halted',
        },
        networkAttachmentRows: [{ subnet: '', securityGroupsRaw: 'sg-web' }],
      },
      catalogWithFieldDefs,
      'compute_instance',
    );
    expect(errors).toEqual({});
  });
});

describe('validateWizardForFinalize', () => {
  it('requires basics fields before create', () => {
    const ordered = getWizardOrderedSteps(catalogWithFieldDefs, 'compute_instance');
    const errors = validateWizardForFinalize(
      { ...INITIAL_STATE, catalogItemId: 'item-1' },
      catalogWithFieldDefs,
      'compute_instance',
      ordered,
    );
    expect(errors.resourceName).toBe('Name is required');
  });

  it('requires a resolved catalog item object before create', () => {
    const ordered = getWizardOrderedSteps(null, 'compute_instance');
    const errors = validateWizardForFinalize(
      { ...INITIAL_STATE, catalogItemId: 'stale-item-id' },
      null,
      'compute_instance',
      ordered,
    );
    expect(errors).toEqual({ catalogItemId: 'Select a catalog item' });
  });
});

describe('buildComputeInstanceFromWizardDraft', () => {
  it('maps wizard draft to compute instance spec with catalog_item', () => {
    const draft = {
      ...INITIAL_STATE,
      catalogItemId: 'catalog-rhel-9',
      resourceName: 'web-01',
      fieldValues: {
        cores: '4',
        memory_gib: '8',
        'boot_disk.size_gib': '64',
        run_strategy: 'Always',
      },
    };
    const vm = buildComputeInstanceFromWizardDraft(draft, catalogWithFieldDefs);
    expect(vm.metadata?.name).toBe('web-01');
    expect(vm.spec?.catalogItem).toBe('catalog-rhel-9');
    expect(vm.spec?.template).toBeUndefined();
    expect(vm.spec?.cores).toBe(4);
    expect(vm.spec?.memoryGib).toBe(8);
    expect(vm.spec?.bootDisk).toEqual({ sizeGib: 64 });
    expect(vm.spec?.runStrategy).toBe('Always');
    expect(vm.spec?.networkAttachments).toBeUndefined();
    expect(vm.spec?.sshKey).toBeUndefined();
  });

  it('applies catalog field definition paths and defaults on create payload', () => {
    const draft = {
      ...INITIAL_STATE,
      catalogItemId: 'catalog-rhel-9',
      resourceName: 'web-03',
      fieldValues: {
        cores: '6',
        'boot_disk.size_gib': '48',
        run_strategy: 'Halted',
      },
    };
    const vm = buildComputeInstanceFromWizardDraft(draft, catalogWithFieldDefs);
    expect(vm.spec?.cores).toBe(6);
    expect(vm.spec?.memoryGib).toBe(8);
    expect(vm.spec?.bootDisk).toEqual({ sizeGib: 48 });
    expect(vm.spec?.runStrategy).toBe('Halted');
  });

  it('seeds field values from catalog defaults', () => {
    expect(seedFieldValuesFromCatalogItem(catalogWithFieldDefs.fieldDefinitions)).toEqual({
      cores: '4',
      memory_gib: '8',
      'boot_disk.size_gib': '40',
      run_strategy: 'Halted',
    });
  });

  it('includes network_attachments from networkAttachmentRows', () => {
    const draft = {
      ...INITIAL_STATE,
      catalogItemId: 'catalog-rhel-9',
      resourceName: 'web-02',
      fieldValues: {
        cores: '2',
        'boot_disk.size_gib': '32',
        run_strategy: 'Halted',
      },
      networkAttachmentRows: [
        {
          subnet: '550e8400-e29b-41d4-a716-446655440000',
          securityGroupsRaw: 'sg-web, sg-ssh',
        },
        {
          subnet: '660e8400-e29b-41d4-a716-446655440001',
          securityGroupsRaw: 'sg-db',
        },
      ],
    };
    const vm = buildComputeInstanceFromWizardDraft(draft, catalogWithFieldDefs);
    expect(vm.spec?.networkAttachments).toEqual([
      {
        subnet: '550e8400-e29b-41d4-a716-446655440000',
        securityGroups: ['sg-web', 'sg-ssh'],
      },
      {
        subnet: '660e8400-e29b-41d4-a716-446655440001',
        securityGroups: ['sg-db'],
      },
    ]);
    expect(vm.spec?.subnet).toBeUndefined();
    expect(vm.spec?.securityGroups).toBeUndefined();
  });
});
