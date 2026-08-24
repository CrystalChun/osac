import { describe, expect, it } from 'vitest';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import { buildComputeInstanceCreatePayload, createEmptyComputeInstanceValues } from './payload';

const vmCatalogItem: ComputeInstanceCatalogItem = {
  $typeName: 'osac.public.v1.ComputeInstanceCatalogItem',
  id: 'catalog-rhel-9',
  metadata: {
    $typeName: 'osac.public.v1.Metadata',
    displayName: '',
    description: '',
    name: 'catalog-rhel-9',
    annotations: {},
    creator: 'foo',
    labels: {},
    project: 'foo',
    tenant: 'foo',
    version: 1,
  },
  title: 'RHEL 9 catalog',
  description: 'RHEL 9 base image',
  template: {
    $typeName: 'osac.public.v1.ComputeInstanceTemplateReference',
    id: 'tpl-rhel-9',
    name: 'tpl-rhel-9',
    project: '',
    shared: false,
  },
  published: true,
  fieldDefinitions: [],
};

const buildValues = (project: string) => ({
  ...createEmptyComputeInstanceValues(),
  catalogItemId: vmCatalogItem.id,
  metadata: { name: 'my-vm', project },
  spec: {
    ...createEmptyComputeInstanceValues().spec,
    instanceType: 'standard-4-8',
    image: { sourceRef: 'quay.io/example/rhel9' },
    networking: {
      virtualNetwork: 'vnet-1',
      subnet: 'subnet-1',
      securityGroups: ['sg-1'],
    },
  },
});

describe('buildComputeInstanceCreatePayload', () => {
  it('builds a catalog-item create payload', () => {
    expect(buildComputeInstanceCreatePayload(buildValues(''), vmCatalogItem)).toEqual({
      metadata: { name: 'my-vm', project: '' },
      spec: {
        catalogItem: { id: vmCatalogItem.id },
        instanceType: { id: 'standard-4-8' },
        image: { sourceType: 'registry', sourceRef: 'quay.io/example/rhel9' },
        runStrategy: 'Always',
        networkAttachments: [
          {
            subnet: { id: 'subnet-1' },
            securityGroups: [{ id: 'sg-1' }],
          },
        ],
      },
    });
  });

  it.each([
    ['default (no project)', ''],
    ['top-level project', 'my-project'],
    ['nested project path', 'parent.child'],
  ])('passes the selected %s through to metadata.project', (_label, project) => {
    expect(buildComputeInstanceCreatePayload(buildValues(project), vmCatalogItem).metadata).toEqual(
      {
        name: 'my-vm',
        project,
      },
    );
  });
});
