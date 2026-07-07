import type { ClusterTemplate } from '@osac/types';

export interface ClusterNodeSetValues {
  hostType: string;
  size: string;
}

export interface ClusterWizardValues {
  catalogItemId: string;
  metadata: {
    name: string;
  };
  spec: {
    sshPublicKey: string;
    pullSecret: string;
    releaseImage: string;
    nodeSets: Record<string, ClusterNodeSetValues>;
    network: {
      podCidr: string;
      serviceCidr: string;
    };
  };
}

export const CLUSTER_CONFIGURATION_CATALOG_PATHS = ['release_image', 'spec.release_image'] as const;

export const CLUSTER_NETWORKING_CATALOG_PATHS = [
  'network.pod_cidr',
  'spec.network.pod_cidr',
  'network.service_cidr',
  'spec.network.service_cidr',
] as const;

export const buildNodeSetsFromTemplate = (
  template: ClusterTemplate,
): Record<string, ClusterNodeSetValues> => {
  const nodeSets: Record<string, ClusterNodeSetValues> = {};
  for (const [poolName, pool] of Object.entries(template.nodeSets ?? {})) {
    const defaultSize = pool.size > 0 ? pool.size : 1;
    nodeSets[poolName] = {
      hostType: pool.hostType,
      size: String(defaultSize),
    };
  }
  return nodeSets;
};
