import { type MessageInitShape } from '@bufbuild/protobuf';

import { type ComputeInstanceCatalogItem, ComputeInstanceSchema } from '@osac/types';

import type { ComputeInstanceWizardValues } from './fields';
import { VM_CREATE_RUN_STRATEGY } from './fields';

export const createEmptyComputeInstanceValues = (): ComputeInstanceWizardValues => ({
  catalogItemId: '',
  metadata: { name: '', project: '' },
  spec: {
    sshPublicKey: '',
    image: { sourceRef: '' },
    instanceType: '',
    userData: '',
    bootDisk: { sizeGib: '', storageTier: '' },
    additionalDisks: [],
    networking: {
      virtualNetwork: '',
      subnet: '',
      securityGroups: [],
    },
  },
});

const tierField = (storageTier: string): { storageTier?: string } => {
  const trimmed = storageTier.trim();
  return trimmed ? { storageTier: trimmed } : {};
};

export const buildComputeInstanceCreatePayload = (
  values: ComputeInstanceWizardValues,
  catalogItem: ComputeInstanceCatalogItem,
): MessageInitShape<typeof ComputeInstanceSchema> => {
  const spec: MessageInitShape<typeof ComputeInstanceSchema>['spec'] = {
    catalogItem: {
      id: catalogItem.id,
    },
    instanceType: {
      id: values.spec.instanceType,
    },
    image: {
      sourceType: 'registry',
      sourceRef: values.spec.image.sourceRef.trim(),
    },
    runStrategy: VM_CREATE_RUN_STRATEGY,
    networkAttachments: [
      {
        subnet: {
          id: values.spec.networking.subnet,
        },
        securityGroups: values.spec.networking.securityGroups.map((id) => ({ id })),
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
    spec.bootDisk = { sizeGib: Number(bootDiskRaw), ...tierField(values.spec.bootDisk.storageTier) };
  }

  const additionalDisks = values.spec.additionalDisks
    .filter((disk) => disk.sizeGib.trim())
    .map((disk) => ({ sizeGib: Number(disk.sizeGib.trim()), ...tierField(disk.storageTier) }));
  if (additionalDisks.length > 0) {
    spec.additionalDisks = additionalDisks;
  }

  return {
    metadata: { name: values.metadata.name.trim(), project: values.metadata.project },
    spec,
  };
};
