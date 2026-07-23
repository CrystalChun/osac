import React, { type ReactNode, createElement } from 'react';
import { createRouterTransport } from '@connectrpc/connect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { BareMetalInstanceCatalogItem } from '@osac/types';
import { BareMetalInstanceCatalogItems } from '@osac/types';
import type { BareMetalInstanceCatalogItem as PrivateBareMetalInstanceCatalogItem } from '@osac/types/private';
import { BareMetalInstanceCatalogItems as PrivateBareMetalInstanceCatalogItems } from '@osac/types/private';

import {
  useAdminBareMetalInstanceCatalogItems,
  useAdminSetBareMetalInstanceCatalogItemPublished,
} from './baremetal-instance';
import { SessionProvider } from '../../hooks/use-session';
import { ApiProvider } from '../api-context';

const publicItem: BareMetalInstanceCatalogItem = {
  $typeName: 'osac.public.v1.BareMetalInstanceCatalogItem',
  id: 'public-1',
  title: 'Public bare metal item',
  description: '',
  template: '',
  published: true,
  fieldDefinitions: [],
};

const privateItem: PrivateBareMetalInstanceCatalogItem = {
  $typeName: 'osac.private.v1.BareMetalInstanceCatalogItem',
  id: 'private-1',
  title: 'Private bare metal item',
  description: '',
  template: '',
  published: true,
  tenant: '',
  fieldDefinitions: [],
};

const createTestTransport = (options: {
  onPublicList?: () => void;
  onPrivateList?: () => void;
  onPublicUpdate?: (req: unknown) => void;
  onPrivateUpdate?: (req: unknown) => void;
}) =>
  createRouterTransport((router) => {
    router.service(BareMetalInstanceCatalogItems, {
      list: () => {
        options.onPublicList?.();
        return { items: [publicItem] };
      },
      update: (req) => {
        options.onPublicUpdate?.(req);
        return { object: publicItem };
      },
    });

    router.service(PrivateBareMetalInstanceCatalogItems, {
      list: () => {
        options.onPrivateList?.();
        return { items: [privateItem] };
      },
      update: (req) => {
        options.onPrivateUpdate?.(req);
        return { object: privateItem };
      },
    });
  });

const renderWithSession = <T>(
  hook: () => T,
  role: 'providerAdmin' | 'tenantAdmin',
  transport: ReturnType<typeof createRouterTransport>,
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(
      SessionProvider,
      { role, username: 'test-user' } as React.ComponentProps<typeof SessionProvider>,
      createElement(
        ApiProvider,
        { transport } as React.ComponentProps<typeof ApiProvider>,
        createElement(QueryClientProvider, { client: queryClient }, children),
      ),
    );
  return { ...renderHook(hook, { wrapper }), queryClient };
};

describe('useAdminBareMetalInstanceCatalogItems', () => {
  it('calls the private List endpoint for providerAdmin', async () => {
    let privateListCalled = false;
    let publicListCalled = false;
    const transport = createTestTransport({
      onPrivateList: () => {
        privateListCalled = true;
      },
      onPublicList: () => {
        publicListCalled = true;
      },
    });

    const { result } = renderWithSession(
      () => useAdminBareMetalInstanceCatalogItems(),
      'providerAdmin',
      transport,
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([privateItem]);
    expect(privateListCalled).toBe(true);
    expect(publicListCalled).toBe(false);
  });

  it('calls the public List endpoint for tenantAdmin', async () => {
    let privateListCalled = false;
    let publicListCalled = false;
    const transport = createTestTransport({
      onPrivateList: () => {
        privateListCalled = true;
      },
      onPublicList: () => {
        publicListCalled = true;
      },
    });

    const { result } = renderWithSession(
      () => useAdminBareMetalInstanceCatalogItems(),
      'tenantAdmin',
      transport,
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([publicItem]);
    expect(publicListCalled).toBe(true);
    expect(privateListCalled).toBe(false);
  });

  it('does not call either endpoint when disabled', async () => {
    let privateListCalled = false;
    let publicListCalled = false;
    const transport = createTestTransport({
      onPrivateList: () => {
        privateListCalled = true;
      },
      onPublicList: () => {
        publicListCalled = true;
      },
    });

    renderWithSession(
      () => useAdminBareMetalInstanceCatalogItems({}, false),
      'providerAdmin',
      transport,
    );

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(privateListCalled).toBe(false);
    expect(publicListCalled).toBe(false);
  });
});

describe('useAdminSetBareMetalInstanceCatalogItemPublished', () => {
  it('sends the update with a published field mask to the private client for providerAdmin', async () => {
    let lastReq: unknown;
    const transport = createTestTransport({
      onPrivateUpdate: (req) => {
        lastReq = req;
      },
    });

    const { result } = renderWithSession(
      () => useAdminSetBareMetalInstanceCatalogItemPublished(),
      'providerAdmin',
      transport,
    );

    act(() => {
      result.current.mutate({ id: 'private-1', published: false });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(lastReq).toMatchObject({
      object: { id: 'private-1', published: false },
      updateMask: { paths: ['published'] },
    });
  });

  it('sends the update to the public client for tenantAdmin', async () => {
    let lastReq: unknown;
    let privateCalled = false;
    const transport = createTestTransport({
      onPublicUpdate: (req) => {
        lastReq = req;
      },
      onPrivateUpdate: () => {
        privateCalled = true;
      },
    });

    const { result } = renderWithSession(
      () => useAdminSetBareMetalInstanceCatalogItemPublished(),
      'tenantAdmin',
      transport,
    );

    act(() => {
      result.current.mutate({ id: 'public-1', published: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(lastReq).toMatchObject({
      object: { id: 'public-1', published: true },
      updateMask: { paths: ['published'] },
    });
    expect(privateCalled).toBe(false);
  });
});
