import { createRouterTransport } from '@connectrpc/connect';
import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types/private';
import { ClusterCatalogItems } from '@osac/types/private';

import { usePrivateClusterCatalogItems } from './cluster-catalog-item';
import { renderHookWithProviders } from '../../../test-utils/TestProviders';

const item: ClusterCatalogItem = {
  $typeName: 'osac.private.v1.ClusterCatalogItem',
  id: 'private-1',
  title: 'Private cluster item',
  description: '',
  template: '',
  published: true,
  tenant: 'acme-corp',
  fieldDefinitions: [],
};

describe('usePrivateClusterCatalogItems', () => {
  it('fetches items from the private ClusterCatalogItems List endpoint', async () => {
    const transport = createRouterTransport((router) => {
      router.service(ClusterCatalogItems, { list: () => ({ items: [item] }) });
    });

    const { result } = renderHookWithProviders(() => usePrivateClusterCatalogItems(), {
      role: 'providerAdmin',
      transport,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([item]);
  });

  it('does not fetch when disabled', async () => {
    let listCalled = false;
    const transport = createRouterTransport((router) => {
      router.service(ClusterCatalogItems, {
        list: () => {
          listCalled = true;
          return { items: [item] };
        },
      });
    });

    renderHookWithProviders(() => usePrivateClusterCatalogItems({}, false), {
      role: 'providerAdmin',
      transport,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(listCalled).toBe(false);
  });
});
