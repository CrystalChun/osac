import type { ClusterCatalogItem } from '@osac/types';

import type { ClusterWizardValues } from './fields';
import type { BuildClusterCreateBodyInput } from '../../../../../api/v1/cluster-wire';

export const createEmptyClusterValues = (): ClusterWizardValues => ({
  catalogItemId: '',
  templateState: { resolved: true, poolNames: [] },
  metadata: { name: '' },
  spec: {
    sshPublicKey: '',
    pullSecret: '',
    releaseImage: '',
    nodeSets: {},
    network: {
      podCidr: '',
      serviceCidr: '',
    },
  },
});

export const buildClusterCreatePayload = (
  values: ClusterWizardValues,
  catalogItem: ClusterCatalogItem,
): BuildClusterCreateBodyInput => {
  const spec: Record<string, unknown> = {
    catalogItem: catalogItem.id,
    releaseImage: values.spec.releaseImage.trim(),
    pullSecret: values.spec.pullSecret.trim(),
  };

  const sshPublicKey = values.spec.sshPublicKey.trim();
  if (sshPublicKey) {
    spec.sshPublicKey = sshPublicKey;
  }

  const nodeSetsWire: Record<string, { hostType: string; size: number }> = {};
  for (const [poolName, pool] of Object.entries(values.spec.nodeSets)) {
    const size = Number(pool.size);
    if (!Number.isFinite(size) || size <= 0) {
      continue;
    }
    nodeSetsWire[poolName] = {
      hostType: pool.hostType.value.trim(),
      size,
    };
  }
  if (Object.keys(nodeSetsWire).length > 0) {
    spec.nodeSets = nodeSetsWire;
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
