import type { ComputeInstanceCatalogItem } from '@osac/types';

export const vmCatalogItem = {
  id: 'catalog-rhel-9',
  metadata: { name: 'catalog-rhel-9' },
  title: 'RHEL 9 catalog',
  description: 'RHEL 9 base image',
  template: 'tpl-rhel-9',
  published: true,
  fieldDefinitions: [
    {
      path: 'spec.image.source_ref',
      displayName: 'VM image',
      editable: true,
      default: 'quay.io/example/rhel9',
    },
  ],
} as unknown as ComputeInstanceCatalogItem;

export const unpublishedCatalogItem = {
  ...vmCatalogItem,
  id: 'catalog-unpublished',
  title: 'Unpublished catalog',
  published: false,
} as unknown as ComputeInstanceCatalogItem;

export const mockVirtualNetwork = {
  id: 'vn-1',
  metadata: { name: 'tenant-vn' },
};

export const mockSubnet = {
  id: 'subnet-1',
  metadata: { name: 'tenant-subnet' },
  spec: { virtualNetwork: 'vn-1' },
};

export const mockSecurityGroup = {
  id: 'sg-1',
  metadata: { name: 'default-sg' },
  spec: { virtualNetwork: 'vn-1' },
};

export const mockInstanceType = {
  id: 'standard-4-8',
  metadata: { name: 'standard-4-8' },
  spec: {
    cores: 4,
    memory_gib: 8,
    state: 'INSTANCE_TYPE_STATE_ACTIVE',
  },
};
