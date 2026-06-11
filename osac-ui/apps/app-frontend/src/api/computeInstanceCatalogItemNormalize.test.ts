import { describe, expect, it } from 'vitest';
import {
  normalizeComputeInstanceCatalogItem,
  normalizeComputeInstanceCatalogItemPage,
} from '@osac/api-contracts/computeInstanceCatalogItemNormalize';

describe('normalizeComputeInstanceCatalogItem', () => {
  it('maps wire payload to UI model', () => {
    const item = normalizeComputeInstanceCatalogItem({
      id: 'catalog-1',
      title: 'General purpose VM',
      description: 'A balanced VM offering',
      template: 'tpl-general',
      published: true,
      metadata: { name: 'catalog-1', version: 1 },
      field_definitions: [{ path: 'spec.cores', editable: true }],
    });
    expect(item.id).toBe('catalog-1');
    expect(item.title).toBe('General purpose VM');
    expect(item.template).toBe('tpl-general');
    expect(item.published).toBe(true);
    expect(item.fieldDefinitions).toHaveLength(1);
  });

  it('normalizes list page envelope', () => {
    const page = normalizeComputeInstanceCatalogItemPage({
      size: 1,
      total: 1,
      items: [
        {
          id: 'catalog-1',
          title: 'Item',
          template: 'tpl-1',
          published: true,
          metadata: { name: 'catalog-1' },
        },
      ],
    });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.id).toBe('catalog-1');
  });
});
