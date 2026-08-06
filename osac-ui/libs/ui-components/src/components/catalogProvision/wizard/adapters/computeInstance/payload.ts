import { type MessageInitShape } from '@bufbuild/protobuf';

import { type ComputeInstanceCatalogItem, ComputeInstanceSchema } from '@osac/types';

import type { ComputeInstanceWizardValues } from './fields';
import { VM_CREATE_RUN_STRATEGY } from './fields';

export const createEmptyComputeInstanceValues = (): ComputeInstanceWizardValues => ({
  catalogItemId: '',
  metadata: { name: '' },
  spec: {
    sshPublicKey: '',
    image: { sourceRef: '' },
    instanceType: '',
    userData: '',
    bootDisk: { sizeGib: '' },
    networking: {
      virtualNetwork: '',
      subnet: '',
      securityGroups: [],
    },
  },
});

export const buildComputeInstanceCreatePayload = (
  values: ComputeInstanceWizardValues,
  catalogItem: ComputeInstanceCatalogItem,
): MessageInitShape<typeof ComputeInstanceSchema> => {
  const spec: MessageInitShape<typeof ComputeInstanceSchema>['spec'] = {
    catalogItem: catalogItem.id,
    instanceType: values.spec.instanceType,
    image: {
      sourceType: 'registry',
      sourceRef: values.spec.image.sourceRef.trim(),
    },
    runStrategy: VM_CREATE_RUN_STRATEGY,
    networkAttachments: [
      {
        subnet: values.spec.networking.subnet,
        securityGroups: values.spec.networking.securityGroups,
      },
    ],
  };

  const sshPublicKey = values.spec.sshPublicKey.trim();
  if (sshPublicKey) {
    spec.sshPublicKey = sshPublicKey;
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
