import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { BuildComputeInstanceCreateBodyInput } from '../../../../../api/v1/compute-instance-wire';
import type { ComputeInstanceWizardValues } from './fields';
import { VM_CREATE_RUN_STRATEGY } from './fields';

export const createEmptyComputeInstanceValues = (): ComputeInstanceWizardValues => ({
  catalogItemId: '',
  metadata: { name: '' },
  spec: {
    sshKey: '',
    image: { sourceRef: '' },
    instanceType: '',
    userData: '',
    bootDisk: { sizeGib: '' },
    networking: {
      virtualNetworkId: '',
      subnetId: '',
      securityGroupIds: [],
    },
  },
});

export const buildComputeInstanceCreatePayload = (
  values: ComputeInstanceWizardValues,
  catalogItem: ComputeInstanceCatalogItem,
): BuildComputeInstanceCreateBodyInput => {
  const instanceType = values.spec.instanceType.trim();

  const spec: Record<string, unknown> = {
    catalogItem: catalogItem.id,
    instanceType,
    image: {
      sourceType: 'registry',
      sourceRef: values.spec.image.sourceRef.trim(),
    },
    runStrategy: VM_CREATE_RUN_STRATEGY,
    networkAttachments: [
      {
        subnet: values.spec.networking.subnetId,
        securityGroups: values.spec.networking.securityGroupIds,
      },
    ],
  };

  const sshKey = values.spec.sshKey.trim();
  if (sshKey) {
    spec.sshKey = sshKey;
  }

  const userData = values.spec.userData.trim();
  if (userData) {
    spec.userData = userData;
  }

  const bootDiskRaw = values.spec.bootDisk.sizeGib.trim();
  if (bootDiskRaw) {
    spec.bootDisk = { sizeGib: Number(bootDiskRaw) };
  }

  return {
    metadata: { name: values.metadata.name.trim() },
    spec,
  };
};
