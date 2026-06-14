import { describe, expect, it } from 'vitest';
import type { ComputeInstanceCatalogItem } from '@osac/api-contracts/types';
import {
  catalogItemMetadataLabelEntries,
  catalogItemResourceLine,
  catalogItemResourceParts,
} from './catalogItemDisplay';

const sampleItem: ComputeInstanceCatalogItem = {
  id: 'catalog-1',
  metadata: { name: 'catalog-1' },
  title: 'Workload VM',
  template: 'tpl-1',
  published: true,
  fieldDefinitions: [
    {
      path: 'cores',
      displayName: 'vCPUs',
      editable: true,
      default: 4,
    },
    {
      path: 'memory_gib',
      displayName: 'RAM (GiB)',
      editable: true,
      default: 8,
    },
    {
      path: 'boot_disk.size_gib',
      displayName: 'Boot disk (GiB)',
      editable: true,
      default: 40,
    },
  ],
};

describe('catalogItemResourceParts', () => {
  it('uses field definition display names on catalog cards', () => {
    expect(catalogItemResourceParts(sampleItem)).toEqual([
      '4 vCPUs',
      '8 RAM (GiB)',
      '40 Boot disk (GiB)',
    ]);
    expect(catalogItemResourceLine(sampleItem)).toBe('4 vCPUs · 8 RAM (GiB) · 40 Boot disk (GiB)');
  });

  it('excludes non-resource field definitions from catalog cards', () => {
    expect(
      catalogItemResourceParts({
        ...sampleItem,
        fieldDefinitions: [
          ...(sampleItem.fieldDefinitions ?? []),
          {
            path: 'subnet',
            displayName: 'Subnet',
            editable: true,
            default: 'workload-subnet-a',
          },
          {
            path: 'ssh_key',
            displayName: 'SSH public key',
            editable: true,
            default: 'ssh-rsa AAAA...',
          },
          {
            path: 'run_strategy',
            displayName: 'Run strategy',
            editable: false,
            default: 'Always',
          },
        ],
      }),
    ).toEqual(['4 vCPUs', '8 RAM (GiB)', '40 Boot disk (GiB)']);
  });
});

describe('catalogItemMetadataLabelEntries', () => {
  it('returns sorted metadata label key/value pairs', () => {
    expect(
      catalogItemMetadataLabelEntries({
        ...sampleItem,
        metadata: {
          name: 'catalog-1',
          labels: {
            workload: 'general',
            tier: 'standard',
            environment: 'non-production',
          },
        },
      }),
    ).toEqual([
      { key: 'environment', value: 'non-production' },
      { key: 'tier', value: 'standard' },
      { key: 'workload', value: 'general' },
    ]);
  });
});
