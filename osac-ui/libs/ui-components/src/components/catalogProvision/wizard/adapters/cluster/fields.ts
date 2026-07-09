import type { ClusterTemplate } from '@osac/types';

import type { LabeledResourceRef } from '../../../../Form/labeledResourceRef';

export interface ClusterNodeSetValues {
  hostType: LabeledResourceRef;
  size: string;
}

/** Tracks cluster template fetch state for Configuration-step validation. */
export interface ClusterTemplateState {
  resolved: boolean;
  poolNames: string[];
}

export interface ClusterWizardValues {
  catalogItemId: string;
  templateState: ClusterTemplateState;
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

export const CLUSTER_SSH_KEY_WIRE_PATH = 'ssh_public_key';
export const CLUSTER_SSH_KEY_FORM_PATH = 'spec.sshPublicKey';
export const CLUSTER_PULL_SECRET_FORM_PATH = 'spec.pullSecret';

export const clusterSshKeyWirePath = CLUSTER_SSH_KEY_WIRE_PATH;

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
      hostType: { value: pool.hostType, label: '' },
      size: String(defaultSize),
    };
  }
  return nodeSets;
};
