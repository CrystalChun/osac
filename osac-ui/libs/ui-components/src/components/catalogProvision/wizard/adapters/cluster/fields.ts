import type { LabeledResourceRef } from '../../../../Form/labeledResourceRef';

export interface ClusterNodeSetRow {
  rowId: string;
  hostType: LabeledResourceRef;
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
    nodeSetRows: ClusterNodeSetRow[];
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

let nextNodeSetRowId = 0;

export const createNodeSetRowId = (): string => {
  nextNodeSetRowId += 1;
  return `node-set-row-${nextNodeSetRowId}`;
};

export const createEmptyNodeSetRow = (): ClusterNodeSetRow => ({
  rowId: createNodeSetRowId(),
  hostType: { value: '', label: '' },
  size: '',
});
