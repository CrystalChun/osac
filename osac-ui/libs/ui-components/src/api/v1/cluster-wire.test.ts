import { describe, expect, it } from 'vitest';

import { buildClusterCreateBody } from './cluster-wire';

describe('buildClusterCreateBody', () => {
  it('builds catalog-item create with node_sets and optional fields omitted when blank', () => {
    const body = buildClusterCreateBody(
      {
        metadata: { name: 'my-cluster' },
        spec: {
          catalogItem: 'cat-1',
          pullSecret: 'pull-secret',
          releaseImage: '4.17.0',
          sshPublicKey: '',
          nodeSets: {
            compute: { hostType: 'acme_1tb', size: 3 },
          },
          network: {
            podCidr: '',
            serviceCidr: '10.128.0.0/14',
          },
        },
      },
      { specCatalogItemOnly: true },
    );

    expect(body).toEqual({
      metadata: { name: 'my-cluster' },
      spec: {
        catalog_item: 'cat-1',
        pull_secret: 'pull-secret',
        release_image: '4.17.0',
        node_sets: {
          compute: { host_type: 'acme_1tb', size: 3 },
        },
        network: {
          service_cidr: '10.128.0.0/14',
        },
      },
    });
  });

  it('omits node_sets when empty', () => {
    const body = buildClusterCreateBody(
      {
        metadata: { name: 'empty-pools' },
        spec: {
          catalogItem: 'cat-1',
          pullSecret: 'secret',
          releaseImage: '4.17.0',
          nodeSets: {},
        },
      },
      { specCatalogItemOnly: true },
    );

    expect(body.spec).not.toHaveProperty('node_sets');
  });
});
