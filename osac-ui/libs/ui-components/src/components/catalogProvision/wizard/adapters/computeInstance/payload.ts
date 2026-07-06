import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { ComputeInstanceWizardValues } from './fields';
import { EMPTY_LABELED_RESOURCE_REF, VM_CREATE_RUN_STRATEGY } from './fields';
import type { BuildComputeInstanceCreateBodyInput } from '../../../../../api/v1/compute-instance-wire';

export const createEmptyComputeInstanceValues = (): ComputeInstanceWizardValues => ({
  catalogItemId: '',
  metadata: { name: '' },
  spec: {
    sshKey: '',
    image: { sourceRef: '' },
    instanceType: EMPTY_LABELED_RESOURCE_REF,
    userData: '',
    bootDisk: { sizeGib: '' },
    networking: {
      virtualNetwork: EMPTY_LABELED_RESOURCE_REF,
      subnet: EMPTY_LABELED_RESOURCE_REF,
      securityGroups: [],
    },
  },
});

export const buildComputeInstanceCreatePayload = (
  values: ComputeInstanceWizardValues,
  catalogItem: ComputeInstanceCatalogItem,
): BuildComputeInstanceCreateBodyInput => {
  const instanceType = values.spec.instanceType.value.trim();

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
        subnet: values.spec.networking.subnet.value,
        securityGroups: values.spec.networking.securityGroups.map((group) => group.value),
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
