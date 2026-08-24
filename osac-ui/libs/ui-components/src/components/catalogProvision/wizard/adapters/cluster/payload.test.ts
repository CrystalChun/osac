import { describe, expect, it } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types';

import { createEmptyNodeSetRow } from './fields';
import { buildClusterCreatePayload, createEmptyClusterValues } from './payload';

const clusterCatalogItem: ClusterCatalogItem = {
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'catalog-openshift-4',
  metadata: {
    $typeName: 'osac.public.v1.Metadata',
    displayName: '',
    description: '',
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
  template: {
    $typeName: 'osac.public.v1.ClusterTemplateReference',
    id: 'tpl-openshift-4',
    name: '',
    project: '',
    shared: false,
  },
  published: true,
  fieldDefinitions: [
    {
      $typeName: 'osac.public.v1.FieldDefinition',
      path: 'version',
      displayName: 'Version',
      editable: true,
      validationSchema: '',
    },
  ],
};

describe('buildClusterCreatePayload', () => {
  it('builds catalog-item create payload with node sets keyed by host type id', () => {
    const row = createEmptyNodeSetRow();
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'my-cluster', project: '' },
      spec: {
        ...createEmptyClusterValues().spec,
        sshPublicKey: 'ssh-rsa AAAA',
        pullSecret: '{"auths":{}}',
        versionName: '4-17-0',
        nodeSetRows: [
          {
            ...row,
            hostType: 'acme_1tb',
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
      metadata: { name: 'my-cluster', project: '' },
      spec: {
        catalogItem: { id: clusterCatalogItem.id },
        sshPublicKey: 'ssh-rsa AAAA',
        pullSecret: '{"auths":{}}',
        version: { name: '4-17-0' },
        nodeSets: {
          acme_1tb: { hostType: { id: 'acme_1tb' }, size: 3 },
        },
        network: {
          podCidr: '10.128.0.0/14',
        },
      },
    });
  });

  it('omits blank optional fields, version, and node sets when no valid rows exist', () => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'empty-pools', project: '' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecret: 'secret',
        versionName: '',
        nodeSetRows: [],
        network: { podCidr: '', serviceCidr: '' },
      },
    };

    const payload = buildClusterCreatePayload(values, clusterCatalogItem);
    expect(payload.spec).toEqual({
      catalogItem: { id: clusterCatalogItem.id },
      pullSecret: 'secret',
    });
    expect(payload.spec).not.toHaveProperty('version');
    expect(payload.spec).not.toHaveProperty('nodeSets');
    expect(payload.spec).not.toHaveProperty('network');
  });

  it('filters out invalid node set rows from the payload', () => {
    const row = createEmptyNodeSetRow();
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'filtered-pools', project: '' },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecret: 'secret',
        versionName: '4-17-0',
        nodeSetRows: [
          { ...row, hostType: '', size: '3' },
          { ...row, hostType: 'acme_1tb', size: '0' },
          { ...row, hostType: 'acme_2tb', size: 'not-a-number' },
          { ...row, hostType: 'acme_1tb', size: '3' },
        ],
        network: { podCidr: '', serviceCidr: '' },
      },
    };

    const payload = buildClusterCreatePayload(values, clusterCatalogItem);
    expect(payload.spec?.nodeSets).toEqual({
      acme_1tb: { hostType: { id: 'acme_1tb' }, size: 3 },
    });
  });

  it.each([
    ['default (no project)', ''],
    ['top-level project', 'my-project'],
    ['nested project path', 'parent.child'],
  ])('passes the selected %s through to metadata.project', (_label, project) => {
    const values = {
      ...createEmptyClusterValues(),
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'my-cluster', project },
      spec: {
        ...createEmptyClusterValues().spec,
        pullSecret: 'secret',
      },
    };

    expect(buildClusterCreatePayload(values, clusterCatalogItem).metadata).toEqual({
      name: 'my-cluster',
      project,
    });
  });
});
