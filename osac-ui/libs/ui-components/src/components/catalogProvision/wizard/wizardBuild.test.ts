import { describe, expect, it } from 'vitest';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import {
  buildComputeInstanceCreatePayload,
  createEmptyComputeInstanceValues,
} from './adapters/computeInstance/payload';
import { getWizardOrderedSteps } from './stepIds';

const catalogItem = {
  id: 'catalog-rhel-9',
  metadata: { name: 'catalog-rhel-9' },
  title: 'RHEL 9 catalog',
  template: 'tpl-rhel-9',
  published: true,
  fieldDefinitions: [
    {
      path: 'spec.image.source_ref',
      displayName: 'VM image',
      editable: true,
    },
  ],
} as unknown as ComputeInstanceCatalogItem;

describe('getWizardOrderedSteps', () => {
  it('returns the fixed five-step VM flow', () => {
    expect(getWizardOrderedSteps()).toEqual([
      'catalog',
      'general',
      'configuration',
      'networking',
      'review',
    ]);
  });
});

describe('buildComputeInstanceCreatePayload', () => {
  it('maps wizard values to compute instance create body with instance type sizing', () => {
    const values = {
      ...createEmptyComputeInstanceValues(),
      catalogItemId: 'catalog-rhel-9',
      metadata: { name: 'web-01' },
      spec: {
        ...createEmptyComputeInstanceValues().spec,
        image: { sourceRef: 'quay.io/example/rhel9' },
        instanceType: 'standard-4-8',
        networking: {
          virtualNetworkId: 'vn-1',
          subnetId: 'subnet-1',
          securityGroupIds: ['sg-1'],
        },
      },
    };

    const vm = buildComputeInstanceCreatePayload(values, catalogItem);
    expect(vm.metadata?.name).toBe('web-01');
    expect(vm.spec?.catalogItem).toBe('catalog-rhel-9');
    expect(vm.spec?.instanceType).toBe('standard-4-8');
    expect(vm.spec?.cores).toBeUndefined();
    expect(vm.spec?.memoryGib).toBeUndefined();
    expect(vm.spec?.image).toEqual({
      sourceType: 'registry',
      sourceRef: 'quay.io/example/rhel9',
    });
    expect(vm.spec?.runStrategy).toBe('Always');
    expect(vm.spec?.networkAttachments).toEqual([
      { subnet: 'subnet-1', securityGroups: ['sg-1'] },
    ]);
  });

  it('omits optional ssh key, user data, and boot disk when blank', () => {
    const values = {
      ...createEmptyComputeInstanceValues(),
      catalogItemId: 'catalog-rhel-9',
      metadata: { name: 'web-02' },
      spec: {
        ...createEmptyComputeInstanceValues().spec,
        image: { sourceRef: 'quay.io/example/rhel9' },
        instanceType: 'standard-4-8',
        networking: {
          virtualNetworkId: 'vn-1',
          subnetId: 'subnet-1',
          securityGroupIds: ['sg-1'],
        },
      },
    };

    const vm = buildComputeInstanceCreatePayload(values, catalogItem);
    expect(vm.spec?.runStrategy).toBe('Always');
    expect(vm.spec?.sshKey).toBeUndefined();
    expect(vm.spec?.userData).toBeUndefined();
    expect(vm.spec?.bootDisk).toBeUndefined();
  });

  it('includes optional fields when provided', () => {
    const values = {
      ...createEmptyComputeInstanceValues(),
      catalogItemId: 'catalog-rhel-9',
      metadata: { name: 'web-03' },
      spec: {
        ...createEmptyComputeInstanceValues().spec,
        sshKey: 'ssh-rsa AAAA',
        userData: '#cloud-config',
        bootDisk: { sizeGib: '64' },
        image: { sourceRef: 'quay.io/example/rhel9' },
        instanceType: 'standard-4-8',
        networking: {
          virtualNetworkId: 'vn-1',
          subnetId: 'subnet-1',
          securityGroupIds: ['sg-1'],
        },
      },
    };

    const vm = buildComputeInstanceCreatePayload(values, catalogItem);
    expect(vm.spec?.sshKey).toBe('ssh-rsa AAAA');
    expect(vm.spec?.userData).toBe('#cloud-config');
    expect(vm.spec?.bootDisk).toEqual({ sizeGib: 64 });
  });
});
