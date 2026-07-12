import { describe, expect, it, vi } from 'vitest';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import { applyVmCatalogGeneralDefaults } from './applyCatalogGeneralDefaults';
import { buildComputeInstanceCreatePayload, createEmptyComputeInstanceValues } from './payload';

const t = (key: string) => key;

describe('applyVmCatalogGeneralDefaults', () => {
  it('prefills ssh default from catalog when defined', () => {
    const setFieldValue = vi.fn();
    const helpers = { setFieldValue } as never;

    applyVmCatalogGeneralDefaults(
      {
        id: 'cat-locked',
        fieldDefinitions: [
          {
            path: 'ssh_key',
            editable: false,
            default: { string_value: 'ssh-ed25519 locked' },
          },
        ],
      } as unknown as ComputeInstanceCatalogItem,
      helpers,
      t,
    );
    expect(setFieldValue).toHaveBeenCalledWith('spec.sshKey', 'ssh-ed25519 locked');

    setFieldValue.mockClear();
    applyVmCatalogGeneralDefaults(
      {
        id: 'cat-editable',
        fieldDefinitions: [
          {
            path: 'ssh_key',
            editable: true,
            default: { string_value: 'ssh-ed25519 default' },
          },
        ],
      } as unknown as ComputeInstanceCatalogItem,
      helpers,
      t,
    );
    expect(setFieldValue).toHaveBeenCalledWith('spec.sshKey', 'ssh-ed25519 default');
  });
});

describe('buildComputeInstanceCreatePayload ssh key', () => {
  it('includes read-only ssh key value in client payload', () => {
    const values = {
      ...createEmptyComputeInstanceValues(),
      catalogItemId: 'cat-locked',
      metadata: { name: 'web-01' },
      spec: {
        ...createEmptyComputeInstanceValues().spec,
        sshKey: 'ssh-ed25519 locked',
        image: { sourceRef: 'quay.io/example/rhel9' },
        networking: {
          virtualNetwork: { value: 'vn-1', label: 'tenant-vn' },
          subnet: { value: 'subnet-1', label: 'tenant-subnet' },
          securityGroups: [{ value: 'sg-1', label: 'default-sg' }],
        },
      },
    };

    const vm = buildComputeInstanceCreatePayload(values, {
      id: 'cat-locked',
    } as ComputeInstanceCatalogItem);
    expect(vm.spec?.sshKey).toBe('ssh-ed25519 locked');
  });

  it('includes prefilled catalog ssh default in client payload', () => {
    const values = {
      ...createEmptyComputeInstanceValues(),
      catalogItemId: 'cat-editable',
      metadata: { name: 'web-02' },
      spec: {
        ...createEmptyComputeInstanceValues().spec,
        sshKey: 'ssh-ed25519 default',
        image: { sourceRef: 'quay.io/example/rhel9' },
        networking: {
          virtualNetwork: { value: 'vn-1', label: 'tenant-vn' },
          subnet: { value: 'subnet-1', label: 'tenant-subnet' },
          securityGroups: [{ value: 'sg-1', label: 'default-sg' }],
        },
      },
    };

    const vm = buildComputeInstanceCreatePayload(values, {
      id: 'cat-editable',
    } as ComputeInstanceCatalogItem);
    expect(vm.spec?.sshKey).toBe('ssh-ed25519 default');
  });

  it('omits ssh key when tenant clears prefilled default', () => {
    const values = {
      ...createEmptyComputeInstanceValues(),
      catalogItemId: 'cat-editable',
      metadata: { name: 'web-02' },
      spec: {
        ...createEmptyComputeInstanceValues().spec,
        image: { sourceRef: 'quay.io/example/rhel9' },
        networking: {
          virtualNetwork: { value: 'vn-1', label: 'tenant-vn' },
          subnet: { value: 'subnet-1', label: 'tenant-subnet' },
          securityGroups: [{ value: 'sg-1', label: 'default-sg' }],
        },
      },
    };

    const vm = buildComputeInstanceCreatePayload(values, {
      id: 'cat-editable',
    } as ComputeInstanceCatalogItem);
    expect(vm.spec?.sshKey).toBeUndefined();
  });
});
