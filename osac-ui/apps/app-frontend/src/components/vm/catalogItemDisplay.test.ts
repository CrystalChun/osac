import { describe, expect, it } from 'vitest';

import { catalogItemResourceLine, catalogItemResourceParts } from './catalogItemDisplay';
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
});
