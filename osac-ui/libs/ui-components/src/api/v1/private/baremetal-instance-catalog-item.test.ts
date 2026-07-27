import { createRouterTransport } from '@connectrpc/connect';
import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { BareMetalInstanceCatalogItem } from '@osac/types/private';
import { BareMetalInstanceCatalogItems } from '@osac/types/private';

import { usePrivateBareMetalInstanceCatalogItems } from './baremetal-instance-catalog-item';
import { renderHookWithProviders } from '../../../test-utils/TestProviders';

const item: BareMetalInstanceCatalogItem = {
  $typeName: 'osac.private.v1.BareMetalInstanceCatalogItem',
  id: 'private-1',
  title: 'Private bare metal item',
  description: '',
  template: '',
  published: true,
  tenant: 'acme-corp',
  fieldDefinitions: [],
};

describe('usePrivateBareMetalInstanceCatalogItems', () => {
  it('fetches items from the private BareMetalInstanceCatalogItems List endpoint', async () => {
    const transport = createRouterTransport((router) => {
      router.service(BareMetalInstanceCatalogItems, { list: () => ({ items: [item] }) });
    });

    const { result } = renderHookWithProviders(() => usePrivateBareMetalInstanceCatalogItems(), {
      role: 'providerAdmin',
      transport,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([item]);
  });

  it('does not fetch when disabled', async () => {
    let listCalled = false;
    const transport = createRouterTransport((router) => {
      router.service(BareMetalInstanceCatalogItems, {
        list: () => {
          listCalled = true;
          return { items: [item] };
        },
      });
    });

    renderHookWithProviders(() => usePrivateBareMetalInstanceCatalogItems({}, false), {
      role: 'providerAdmin',
      transport,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(listCalled).toBe(false);
  });
});
