import type { ClusterCatalogItem, ComputeInstanceCatalogItem } from '@osac/types';
import {
  InstanceTypeState,
  SecurityGroupState,
  SubnetState,
  VirtualNetworkState,
} from '@osac/types';

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

export const clusterCatalogItem = {
  id: 'catalog-openshift-4',
  metadata: { name: 'catalog-openshift-4' },
  title: 'OpenShift 4 cluster',
  description: 'Standard OpenShift cluster offering',
  template: 'tpl-openshift-4',
  published: true,
  fieldDefinitions: [
    {
      path: 'release_image',
      displayName: 'Release image',
      editable: true,
      default: '4.17.0',
    },
  ],
} as unknown as ClusterCatalogItem;

export const mockClusterTemplate = {
  id: 'tpl-openshift-4',
  metadata: { name: 'tpl-openshift-4' },
  nodeSets: {
    compute: { hostType: 'acme_1tb', size: 3 },
  },
};

export const mockHostType = {
  id: 'acme_1tb',
  metadata: { name: 'acme_1tb' },
  title: 'ACME 1TB',
};

export const mockHostTypeH100 = {
  id: 'acme_1tb_h100',
  metadata: { name: 'acme_1tb_h100' },
  title: 'ACME 1TB H100',
};

export const unpublishedCatalogItem = {
  ...vmCatalogItem,
  id: 'catalog-unpublished',
  title: 'Unpublished catalog',
  published: false,
} as unknown as ComputeInstanceCatalogItem;

export const mockVirtualNetwork = {
  id: 'vn-1',
  metadata: { name: 'tenant-vn' },
  status: { state: VirtualNetworkState.READY },
};

export const mockSubnet = {
  id: 'subnet-1',
  metadata: { name: 'tenant-subnet' },
  spec: { virtualNetwork: 'vn-1' },
  status: { state: SubnetState.READY },
};

export const mockSecurityGroup = {
  id: 'sg-1',
  metadata: { name: 'default-sg' },
  spec: { virtualNetwork: 'vn-1' },
  status: { state: SecurityGroupState.READY },
};

export const mockInstanceType = {
  id: 'standard-4-8',
  metadata: { name: 'standard-4-8' },
  spec: {
    cores: 4,
    memory_gib: 8,
    state: InstanceTypeState.ACTIVE,
  },
};
