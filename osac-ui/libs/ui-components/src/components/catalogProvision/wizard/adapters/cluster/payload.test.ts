import { describe, expect, it } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types';

import { createEmptyNodeSetRow } from './fields';
import { buildClusterCreatePayload, createEmptyClusterValues } from './payload';

const clusterCatalogItem: ClusterCatalogItem = {
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'catalog-openshift-4',
  metadata: {
    $typeName: 'osac.public.v1.Metadata',
    name: 'catalog-openshift-4',
    annotations: {},
    creator: 'foo',
    labels: {},
    project: 'foo',
    tenant: 'foo',
    version: 1,
  },
  title: 'OpenShift 4 cluster',
  description: 'Standard OpenShift cluster offering',
  template: 'tpl-openshift-4',
  published: true,
  fieldDefinitions: [
    {
      $typeName: 'osac.public.v1.FieldDefinition',
      path: 'release_image',
      displayName: 'Release image',
      editable: true,
      validationSchema: '',
      default: {
        $typeName: 'google.protobuf.Value',
        kind: { case: 'stringValue', value: '4.17.0' },
      },
    },
  ],
};

describe('buildClusterCreatePayload', () => {
  it('builds catalog-item create payload with node sets keyed by host type id', () => {
    const row = createEmptyNodeSetRow();
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'my-cluster' },
      spec: {
        ...createEmptyClusterValues().spec,
        sshPublicKey: 'ssh-rsa AAAA',
        pullSecret: '{"auths":{}}',
        releaseImage: '4.17.0',
        nodeSetRows: [
          {
            ...row,
            hostType: { value: 'acme_1tb', label: 'ACME 1TB' },
            size: '3',
          },
        ],
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
          acme_1tb: { hostType: 'acme_1tb', size: 3 },
        },
        network: {
          podCidr: '10.128.0.0/14',
        },
      },
    });
  });

  it('omits blank optional fields and node sets when no valid rows exist', () => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'empty-pools' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecret: 'secret',
        releaseImage: '4.17.0',
        nodeSetRows: [],
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

  it('filters out invalid node set rows from the payload', () => {
    const row = createEmptyNodeSetRow();
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'filtered-pools' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecret: 'secret',
        releaseImage: '4.17.0',
        nodeSetRows: [
          { ...row, hostType: { value: '', label: '' }, size: '3' },
          { ...row, hostType: { value: 'acme_1tb', label: 'ACME 1TB' }, size: '0' },
          { ...row, hostType: { value: 'acme_2tb', label: 'ACME 2TB' }, size: 'not-a-number' },
          { ...row, hostType: { value: 'acme_1tb', label: 'ACME 1TB' }, size: '3' },
        ],
        network: { podCidr: '', serviceCidr: '' },
      },
    };

    const payload = buildClusterCreatePayload(values, clusterCatalogItem);
    expect(payload.spec?.nodeSets).toEqual({
      acme_1tb: { hostType: 'acme_1tb', size: 3 },
    });
  });
});
