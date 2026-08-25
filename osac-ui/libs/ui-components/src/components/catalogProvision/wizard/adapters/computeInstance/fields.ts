/** VMs are always created in the running state; stop/start is handled on the details page. */
export const VM_CREATE_RUN_STRATEGY = 'Always' as const;

export interface ComputeInstanceNetworkingValues {
  virtualNetwork: string;
  subnet: string;
  securityGroups: string[];
}

export interface ComputeInstanceDiskValues {
  sizeGib: string;
  /** Storage tier name; empty means "let the server or template default apply". */
  storageTier: string;
}

export interface ComputeInstanceWizardValues {
  catalogItemId: string;
  metadata: {
    name: string;
    project: string;
  };
  spec: {
    sshPublicKey: string;
    image: {
      sourceRef: string;
    };
    instanceType: string;
    userData: string;
    bootDisk: ComputeInstanceDiskValues;
    additionalDisks: ComputeInstanceDiskValues[];
    networking: ComputeInstanceNetworkingValues;
  };
}

export const VM_SSH_KEY_WIRE_PATH = 'ssh_public_key';
export const VM_SSH_KEY_FORM_PATH = 'spec.sshPublicKey';
export const vmSshPublicKeyWirePath = VM_SSH_KEY_WIRE_PATH;

export const CONFIGURATION_CATALOG_PATHS = [
  'spec.image.source_ref',
  'spec.user_data',
  'spec.boot_disk.size_gib',
  'spec.boot_disk.storage_tier',
] as const;
