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
export const CLUSTER_PULL_SECRET_WIRE_PATH = 'pull_secret';
export const CLUSTER_PULL_SECRET_FORM_PATH = 'spec.pullSecret';
export const CLUSTER_RELEASE_IMAGE_WIRE_PATH = 'release_image';
export const CLUSTER_POD_CIDR_WIRE_PATH = 'network.pod_cidr';
export const CLUSTER_SERVICE_CIDR_WIRE_PATH = 'network.service_cidr';

export const clusterSshKeyWirePath = CLUSTER_SSH_KEY_WIRE_PATH;

export const CLUSTER_CONFIGURATION_CATALOG_PATHS = [
  CLUSTER_RELEASE_IMAGE_WIRE_PATH,
  'spec.release_image',
] as const;

export const CLUSTER_NETWORKING_CATALOG_PATHS = [
  CLUSTER_POD_CIDR_WIRE_PATH,
  'spec.network.pod_cidr',
  CLUSTER_SERVICE_CIDR_WIRE_PATH,
  'spec.network.service_cidr',
] as const;

export const createNodeSetRowId = (): string => crypto.randomUUID();

export const createEmptyNodeSetRow = (): ClusterNodeSetRow => ({
  rowId: createNodeSetRowId(),
  hostType: { value: '', label: '' },
  size: '',
});
