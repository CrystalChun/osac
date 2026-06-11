import { describe, expect, it } from 'vitest';
import type { ComputeInstanceCatalogItem } from '@osac/api-contracts/types';
import { INITIAL_STATE } from './constants';
import {
  buildComputeInstanceFromWizardDraft,
  validateWizardForFinalize,
  validateWizardStep,
} from './wizardBuild';

describe('validateWizardStep', () => {
  it('requires a catalog item on the catalog step', () => {
    expect(validateWizardStep('template', INITIAL_STATE)).toEqual({
      selectedCatalogItemId: 'Select a catalog item',
    });
  });

  it('passes catalog step when a catalog item is selected', () => {
    expect(
      validateWizardStep('template', { ...INITIAL_STATE, selectedCatalogItemId: 'item-1' }),
    ).toEqual({});
  });
});

describe('validateWizardForFinalize', () => {
  it('requires customization fields before create', () => {
    const errors = validateWizardForFinalize({
      ...INITIAL_STATE,
      selectedCatalogItemId: 'item-1',
    });
    expect(errors.templateVmName).toBe('Virtual machine name is required');
  });
});

describe('buildComputeInstanceFromWizardDraft', () => {
  it('maps wizard draft to compute instance spec with catalog_item', () => {
    const draft = {
      ...INITIAL_STATE,
      selectedCatalogItemId: 'catalog-rhel-9',
      templateVmName: 'web-01',
      templateCores: '4',
      templateMemoryGib: '8',
      templateBootDiskSizeGib: '64',
      startAfterCreate: true,
    };
    const catalogItem: ComputeInstanceCatalogItem = {
      id: 'catalog-rhel-9',
      metadata: { name: 'catalog-rhel-9' },
      title: 'RHEL 9 catalog',
      template: 'tpl-rhel-9',
      published: true,
    };
    const vm = buildComputeInstanceFromWizardDraft(draft, catalogItem, {
      id: 'tpl-rhel-9',
      title: 'RHEL 9',
      metadata: { name: 'rhel-9' },
      defaultCores: 2,
      defaultMemoryGib: 4,
    });
    expect(vm.metadata?.name).toBe('web-01');
    expect(vm.spec?.catalogItem).toBe('catalog-rhel-9');
    expect(vm.spec?.template).toBeUndefined();
    expect(vm.spec?.cores).toBe(4);
    expect(vm.spec?.memoryGib).toBe(8);
    expect(vm.spec?.bootDisk).toEqual({ sizeGib: 64 });
    expect(vm.spec?.runStrategy).toBe('Always');
  });
});
