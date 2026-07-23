import { describe, expect, it } from 'vitest';

import { ClusterCatalogItem } from '@osac/types';
import type { ClusterCatalogItem as PrivateClusterCatalogItem } from '@osac/types/private';

import {
  SHARED_TENANT,
  catalogItemResourceLine,
  catalogItemResourceParts,
  catalogItemScope,
  catalogItemSubtitle,
  filterCatalogItemsBySearch,
} from './catalogItemDisplay';
import {
  catalogItemFieldDefinitions,
  readCatalogItemFieldDefinitions,
} from '../catalogProvision/catalogFieldDefinition';

describe('readCatalogItemFieldDefinitions', () => {
  it('reads snake_case field_definitions from wire JSON', () => {
    const wireItem = {
      id: 'catalog-1',
      field_definitions: [
        {
          path: 'cores',
          display_name: 'vCPUs',
          editable: true,
          default: { number_value: 4 },
          validation_schema: '{"type":"integer","minimum":2}',
        },
      ],
    };

    expect(readCatalogItemFieldDefinitions(wireItem)).toHaveLength(1);
    expect(catalogItemFieldDefinitions(wireItem)).toEqual([
      {
        path: 'cores',
        displayName: 'vCPUs',
        editable: true,
        default: 4,
        validationSchema: { type: 'integer', minimum: 2 },
      },
    ]);
  });

  it('parses post-decode protobuf Value defaults without mutating the catalog item', () => {
    const decodedItem = {
      id: 'catalog-1',
      fieldDefinitions: [
        {
          path: 'cores',
          displayName: 'vCPUs',
          editable: true,
          default: { kind: { case: 'numberValue', value: 4 } },
        },
      ],
    };

    expect(catalogItemFieldDefinitions(decodedItem)).toEqual([
      {
        path: 'cores',
        displayName: 'vCPUs',
        editable: true,
        default: 4,
      },
    ]);
    expect(decodedItem.fieldDefinitions[0]?.default).toEqual({
      kind: { case: 'numberValue', value: 4 },
    });
  });
});

describe('catalog display with wire field_definitions', () => {
  it('renders resource summary from wire catalog item JSON', () => {
    const wireItem: ClusterCatalogItem = {
      $typeName: 'osac.public.v1.ClusterCatalogItem',
      id: 'catalog-1',
      title: 'Workload VM',
      description: '',
      published: true,
      template: '',
      fieldDefinitions: [
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'cores',
          displayName: 'vCPUs',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: {
              case: 'numberValue',
              value: 4,
            },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'memory_gib',
          displayName: 'RAM (GiB)',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: {
              case: 'numberValue',
              value: 8,
            },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'boot_disk.size_gib',
          displayName: 'Boot disk (GiB)',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: {
              case: 'numberValue',
              value: 40,
            },
          },
          validationSchema: '',
        },
      ],
    };

    expect(catalogItemResourceParts(wireItem)).toEqual([
      '4 vCPUs',
      '8 RAM (GiB)',
      '40 Boot disk (GiB)',
    ]);
    expect(catalogItemResourceLine(wireItem)).toBe('4 vCPUs · 8 RAM (GiB) · 40 Boot disk (GiB)');
  });

  it('renders node set resource summary from cluster catalog item JSON', () => {
    const wireItem: ClusterCatalogItem = {
      $typeName: 'osac.public.v1.ClusterCatalogItem',
      id: '019ecb6a-6cad-7905-b086-a043c388fa60',
      title: 'Development Cluster',
      description: '',
      published: true,
      template: '',
      fieldDefinitions: [
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'node_sets.fc430.host_type',
          displayName: 'Host Type',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: {
              case: 'stringValue',
              value: 'fc430',
            },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'node_sets.fc430.size',
          displayName: 'Worker Count',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: {
              case: 'numberValue',
              value: 2,
            },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'release_image',
          displayName: 'Release Image',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: {
              case: 'stringValue',
              value: 'quay.io/openshift-release-dev/ocp-release:4.17.0-multi',
            },
          },
          validationSchema: '',
        },
      ],
    };

    expect(catalogItemResourceParts(wireItem)).toEqual(['fc430 Host Type', '2 Worker Count']);
    expect(catalogItemResourceLine(wireItem)).toBe('fc430 Host Type · 2 Worker Count');
  });
});

describe('filterCatalogItemsBySearch', () => {
  const items: ClusterCatalogItem[] = [
    {
      $typeName: 'osac.public.v1.ClusterCatalogItem',
      id: '1',
      title: 'Alpha VM',
      description: 'For testing',
      fieldDefinitions: [],
      published: true,
      template: '',
    },
    {
      $typeName: 'osac.public.v1.ClusterCatalogItem',
      id: '2',
      title: 'Beta Cluster',
      description: 'Production workload',
      fieldDefinitions: [],
      published: true,
      template: '',
    },
  ];

  it('returns all items when search is empty or whitespace', () => {
    expect(filterCatalogItemsBySearch(items, '')).toEqual(items);
    expect(filterCatalogItemsBySearch(items, '   ')).toEqual(items);
  });

  it('filters case-insensitively across title and description', () => {
    expect(filterCatalogItemsBySearch(items, 'alpha')).toEqual([items[0]]);
    expect(filterCatalogItemsBySearch(items, 'PRODUCTION')).toEqual([items[1]]);
  });
});

const privateClusterItem = (
  overrides: Partial<PrivateClusterCatalogItem> = {},
): PrivateClusterCatalogItem => ({
  $typeName: 'osac.private.v1.ClusterCatalogItem',
  id: 'catalog-cluster-1',
  metadata: {
    $typeName: 'osac.private.v1.Metadata',
    finalizers: [],
    creator: 'admin',
    tenant: '',
    name: 'catalog-item',
    labels: {},
    annotations: {},
    version: 1,
    project: '',
  },
  title: 'OpenShift 4 cluster',
  description: 'Standard OpenShift cluster offering',
  template: 'tpl-openshift-4',
  published: true,
  tenant: '',
  fieldDefinitions: [],
  ...overrides,
});

const publicVmItemWithMetadata = (tenant: string, project = '') => ({
  $typeName: 'osac.public.v1.ComputeInstanceCatalogItem' as const,
  id: 'catalog-rhel-9',
  metadata: {
    $typeName: 'osac.public.v1.Metadata' as const,
    name: 'catalog-rhel-9',
    annotations: {},
    creator: 'foo',
    labels: {},
    project,
    tenant,
    version: 1,
  },
  title: 'RHEL 9 catalog',
  description: 'RHEL 9 base image',
  template: 'tpl-rhel-9',
  published: true,
  fieldDefinitions: [],
});

describe('catalogItemScope', () => {
  it('returns general for a CSP Admin item with no private tenant', () => {
    const item = privateClusterItem({ tenant: '' });
    expect(catalogItemScope(item, 'providerAdmin')).toEqual({ level: 'general' });
  });

  it('returns general for the providerAdmin role given a public-shaped item lacking a tenant field', () => {
    const item = publicVmItemWithMetadata('acme-corp');
    expect(catalogItemScope(item, 'providerAdmin')).toEqual({ level: 'general' });
  });

  it('returns organization with the tenant name for a CSP Admin item scoped to a tenant', () => {
    const item = privateClusterItem({ tenant: 'acme-corp' });
    expect(catalogItemScope(item, 'providerAdmin')).toEqual({
      level: 'organization',
      name: 'acme-corp',
    });
  });

  it('returns project for a CSP Admin item even when the private tenant is also set', () => {
    const base = privateClusterItem({ tenant: 'acme-corp' });
    const item = { ...base, metadata: { ...base.metadata, project: 'frontend' } };
    expect(catalogItemScope(item, 'providerAdmin')).toEqual({
      level: 'project',
      name: 'frontend',
    });
  });

  it('returns general for a Tenant Admin item whose metadata.tenant is the shared sentinel', () => {
    const item = publicVmItemWithMetadata(SHARED_TENANT);
    expect(catalogItemScope(item, 'tenantAdmin')).toEqual({ level: 'general' });
  });

  it('returns general for a Tenant Admin item whose metadata.tenant is empty', () => {
    const item = publicVmItemWithMetadata('');
    expect(catalogItemScope(item, 'tenantAdmin')).toEqual({ level: 'general' });
  });

  it('returns organization for a Tenant Admin item whose metadata.tenant is not the shared sentinel', () => {
    const item = publicVmItemWithMetadata('acme-corp');
    expect(catalogItemScope(item, 'tenantAdmin')).toEqual({ level: 'organization' });
  });

  it('returns project for a Tenant Admin item with a project set, regardless of metadata.tenant', () => {
    const item = publicVmItemWithMetadata(SHARED_TENANT, 'frontend');
    expect(catalogItemScope(item, 'tenantAdmin')).toEqual({ level: 'project', name: 'frontend' });
  });
});

describe('existing display helpers with private-v1 items', () => {
  it('catalogItemSubtitle falls back to metadata.name when description is empty', () => {
    const item = privateClusterItem({ description: '' });
    expect(catalogItemSubtitle(item)).toBe('catalog-item');
  });

  it('catalogItemSubtitle uses the description when present', () => {
    const item = privateClusterItem();
    expect(catalogItemSubtitle(item)).toBe('Standard OpenShift cluster offering');
  });

  it('filterCatalogItemsBySearch matches a private-v1 item by title', () => {
    const item = privateClusterItem();
    expect(filterCatalogItemsBySearch([item], 'openshift')).toEqual([item]);
    expect(filterCatalogItemsBySearch([item], 'no-such-term')).toEqual([]);
  });
});
