import { createRouterTransport } from '@connectrpc/connect';
import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ComputeInstanceCatalogItem } from '@osac/types/private';
import { ComputeInstanceCatalogItems } from '@osac/types/private';

import { usePrivateComputeInstanceCatalogItems } from './compute-instance-catalog-item';
import { renderHookWithProviders } from '../../../test-utils/TestProviders';

const item: ComputeInstanceCatalogItem = {
  $typeName: 'osac.private.v1.ComputeInstanceCatalogItem',
  id: 'private-1',
  title: 'Private VM item',
  description: '',
  template: '',
  published: true,
  tenant: 'acme-corp',
  fieldDefinitions: [],
};

describe('usePrivateComputeInstanceCatalogItems', () => {
  it('fetches items from the private ComputeInstanceCatalogItems List endpoint', async () => {
    const transport = createRouterTransport((router) => {
      router.service(ComputeInstanceCatalogItems, { list: () => ({ items: [item] }) });
    });

    const { result } = renderHookWithProviders(() => usePrivateComputeInstanceCatalogItems(), {
      role: 'providerAdmin',
      transport,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([item]);
  });

  it('does not fetch when disabled', async () => {
    let listCalled = false;
    const transport = createRouterTransport((router) => {
      router.service(ComputeInstanceCatalogItems, {
        list: () => {
          listCalled = true;
          return { items: [item] };
        },
      });
    });

    renderHookWithProviders(() => usePrivateComputeInstanceCatalogItems({}, false), {
      role: 'providerAdmin',
      transport,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(listCalled).toBe(false);
  });
});
