import { describe, expect, it } from 'vitest';

import {
  type CatalogItemForDisplay,
  catalogItemResourceLine,
  catalogItemResourceParts,
  filterCatalogItemsBySearch,
  inferCatalogItemKind,
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
    const wireItem = {
      id: 'catalog-1',
      title: 'Workload VM',
      field_definitions: [
        {
          path: 'cores',
          display_name: 'vCPUs',
          editable: true,
          default: { number_value: 4 },
        },
        {
          path: 'memory_gib',
          display_name: 'RAM (GiB)',
          editable: true,
          default: { number_value: 8 },
        },
        {
          path: 'boot_disk.size_gib',
          display_name: 'Boot disk (GiB)',
          editable: true,
          default: { number_value: 40 },
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
    const wireItem = {
      id: '019ecb6a-6cad-7905-b086-a043c388fa60',
      title: 'Development Cluster',
      field_definitions: [
        {
          path: 'node_sets.fc430.host_type',
          display_name: 'Host Type',
          default: 'fc430',
        },
        {
          path: 'node_sets.fc430.size',
          display_name: 'Worker Count',
          default: 2,
        },
        {
          path: 'release_image',
          display_name: 'Release Image',
          default: 'quay.io/openshift-release-dev/ocp-release:4.17.0-multi',
        },
      ],
    };

    expect(catalogItemResourceParts(wireItem)).toEqual(['fc430 Host Type', '2 Worker Count']);
    expect(catalogItemResourceLine(wireItem)).toBe('fc430 Host Type · 2 Worker Count');
  });
});

describe('inferCatalogItemKind', () => {
  it('infers vm from compute resource fields', () => {
    const item: CatalogItemForDisplay = {
      id: 'vm-1',
      title: 'VM',
      field_definitions: [{ path: 'cores', default: 4 }],
    };
    expect(inferCatalogItemKind(item)).toBe('vm');
  });

  it('infers cluster from node set fields', () => {
    const item: CatalogItemForDisplay = {
      id: 'cluster-1',
      title: 'Cluster',
      field_definitions: [{ path: 'node_sets.fc430.size', default: 2 }],
    };
    expect(inferCatalogItemKind(item)).toBe('cluster');
  });

  it('defaults to vm when no cluster resource fields exist', () => {
    const item: CatalogItemForDisplay = { id: 'empty-1', title: 'Untyped' };
    expect(inferCatalogItemKind(item)).toBe('vm');
  });
});

describe('filterCatalogItemsBySearch', () => {
  const items: CatalogItemForDisplay[] = [
    { id: '1', title: 'Alpha VM', description: 'For testing' },
    { id: '2', title: 'Beta Cluster', description: 'Production workload' },
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
