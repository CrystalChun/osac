import { type MessageInitShape } from '@bufbuild/protobuf';

import { type ClusterCatalogItem, ClusterSchema } from '@osac/types';

import type { ClusterWizardValues } from './fields';
import { createEmptyNodeSetRow } from './fields';

export const createEmptyClusterValues = (): ClusterWizardValues => ({
  catalogItemId: '',
  metadata: { name: '' },
  spec: {
    sshPublicKey: '',
    pullSecret: '',
    releaseImage: '',
    nodeSetRows: [createEmptyNodeSetRow()],
    network: {
      podCidr: '',
      serviceCidr: '',
    },
  },
});

export const buildClusterCreatePayload = (
  values: ClusterWizardValues,
  catalogItem: ClusterCatalogItem,
): MessageInitShape<typeof ClusterSchema> => {
  const spec: MessageInitShape<typeof ClusterSchema>['spec'] = {
    catalogItem: catalogItem.id,
    releaseImage: values.spec.releaseImage.trim(),
    pullSecret: values.spec.pullSecret.trim(),
  };

  const sshPublicKey = values.spec.sshPublicKey.trim();
  if (sshPublicKey) {
    spec.sshPublicKey = sshPublicKey;
  }

  const nodeSets: Record<string, { hostType: string; size: number }> = {};
  for (const row of values.spec.nodeSetRows) {
    const hostTypeId = row.hostType.value.trim();
    const size = Number(row.size);
    if (!hostTypeId || !Number.isFinite(size) || size <= 0) {
      continue;
    }
    nodeSets[hostTypeId] = { hostType: hostTypeId, size };
  }
  if (Object.keys(nodeSets).length > 0) {
    spec.nodeSets = nodeSets;
  }

  const podCidr = values.spec.network.podCidr.trim();
  const serviceCidr = values.spec.network.serviceCidr.trim();
  if (podCidr || serviceCidr) {
    spec.network = {
      ...(podCidr ? { podCidr } : {}),
      ...(serviceCidr ? { serviceCidr } : {}),
    };
  }

  return {
    metadata: { name: values.metadata.name.trim() },
    spec,
  };
};
