import { describe, expect, it } from 'vitest';

import { buildClusterCreatePayload, createEmptyClusterValues } from './payload';
import { clusterCatalogItem } from '../../../test/fixtures';

describe('buildClusterCreatePayload', () => {
  it('builds catalog-item create payload with node sets and optional network', () => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'my-cluster' },
      spec: {
        ...createEmptyClusterValues().spec,
        sshPublicKey: 'ssh-rsa AAAA',
        pullSecret: '{"auths":{}}',
        releaseImage: '4.17.0',
        nodeSets: {
          compute: { hostType: 'acme_1tb', size: '3' },
        },
        network: {
          podCidr: '10.128.0.0/14',
          serviceCidr: '',
        },
      },
    };

    expect(buildClusterCreatePayload(values, clusterCatalogItem)).toEqual({
      metadata: { name: 'my-cluster' },
      spec: {
        catalogItem: clusterCatalogItem.id,
        sshPublicKey: 'ssh-rsa AAAA',
        pullSecret: '{"auths":{}}',
        releaseImage: '4.17.0',
        nodeSets: {
          compute: { hostType: 'acme_1tb', size: 3 },
        },
        network: {
          podCidr: '10.128.0.0/14',
        },
      },
    });
  });

  it('omits blank optional fields and node sets when empty', () => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'empty-pools' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecret: 'secret',
        releaseImage: '4.17.0',
        nodeSets: {},
        network: { podCidr: '', serviceCidr: '' },
      },
    };

    const payload = buildClusterCreatePayload(values, clusterCatalogItem);
    expect(payload.spec).toEqual({
      catalogItem: clusterCatalogItem.id,
      pullSecret: 'secret',
      releaseImage: '4.17.0',
    });
    expect(payload.spec).not.toHaveProperty('nodeSets');
    expect(payload.spec).not.toHaveProperty('network');
  });
});
