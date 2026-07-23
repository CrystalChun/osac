import React, { type ReactNode, createElement } from 'react';
import { createRouterTransport } from '@connectrpc/connect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types';
import { ClusterCatalogItems } from '@osac/types';
import type { ClusterCatalogItem as PrivateClusterCatalogItem } from '@osac/types/private';
import { ClusterCatalogItems as PrivateClusterCatalogItems } from '@osac/types/private';

import {
  useAdminClusterCatalogItems,
  useAdminSetClusterCatalogItemPublished,
} from './cluster-catalog-item';
import { SessionProvider } from '../../hooks/use-session';
import { ApiProvider } from '../api-context';

const publicItem: ClusterCatalogItem = {
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'public-1',
  title: 'Public cluster item',
  description: '',
  template: '',
  published: true,
  fieldDefinitions: [],
};

const privateItem: PrivateClusterCatalogItem = {
  $typeName: 'osac.private.v1.ClusterCatalogItem',
  id: 'private-1',
  title: 'Private cluster item',
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
    router.service(ClusterCatalogItems, {
      list: () => {
        options.onPublicList?.();
        return { items: [publicItem] };
      },
      update: (req) => {
        options.onPublicUpdate?.(req);
        return { object: publicItem };
      },
    });

    router.service(PrivateClusterCatalogItems, {
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

describe('useAdminClusterCatalogItems', () => {
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
      () => useAdminClusterCatalogItems(),
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
      () => useAdminClusterCatalogItems(),
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

    renderWithSession(() => useAdminClusterCatalogItems({}, false), 'providerAdmin', transport);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(privateListCalled).toBe(false);
    expect(publicListCalled).toBe(false);
  });
});

describe('useAdminSetClusterCatalogItemPublished', () => {
  it('sends the update with a published field mask to the private client for providerAdmin', async () => {
    let lastReq: unknown;
    const transport = createTestTransport({
      onPrivateUpdate: (req) => {
        lastReq = req;
      },
    });

    const { result } = renderWithSession(
      () => useAdminSetClusterCatalogItemPublished(),
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
      () => useAdminSetClusterCatalogItemPublished(),
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
