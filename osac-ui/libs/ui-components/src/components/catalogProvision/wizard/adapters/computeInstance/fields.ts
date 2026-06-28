/** VMs are always created in the running state; stop/start is handled on the details page. */
export const VM_CREATE_RUN_STRATEGY = 'Always' as const;

export interface ComputeInstanceNetworkingValues {
  virtualNetworkId: string;
  subnetId: string;
  securityGroupIds: string[];
}

export interface ComputeInstanceWizardValues {
  catalogItemId: string;
  metadata: {
    name: string;
  };
  spec: {
    sshKey: string;
    image: {
      sourceRef: string;
    };
    instanceType: string;
    userData: string;
    bootDisk: {
      sizeGib: string;
    };
    networking: ComputeInstanceNetworkingValues;
  };
}

export const CONFIGURATION_CATALOG_PATHS = [
  'spec.image.source_ref',
  'spec.user_data',
  'spec.boot_disk.size_gib',
] as const;
