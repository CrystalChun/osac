import React, { type ReactNode, createElement } from 'react';
import { createRouterTransport } from '@connectrpc/connect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ComputeInstanceCatalogItem } from '@osac/types';
import { ComputeInstanceCatalogItems } from '@osac/types';
import type { ComputeInstanceCatalogItem as PrivateComputeInstanceCatalogItem } from '@osac/types/private';
import { ComputeInstanceCatalogItems as PrivateComputeInstanceCatalogItems } from '@osac/types/private';

import {
  useAdminComputeInstanceCatalogItems,
  useAdminSetComputeInstanceCatalogItemPublished,
} from './compute-instance-catalog-item';
import { SessionProvider } from '../../hooks/use-session';
import { ApiProvider } from '../api-context';

const publicItem: ComputeInstanceCatalogItem = {
  $typeName: 'osac.public.v1.ComputeInstanceCatalogItem',
  id: 'public-1',
  title: 'Public VM item',
  description: '',
  template: '',
  published: true,
  fieldDefinitions: [],
};

const privateItem: PrivateComputeInstanceCatalogItem = {
  $typeName: 'osac.private.v1.ComputeInstanceCatalogItem',
  id: 'private-1',
  title: 'Private VM item',
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
    router.service(ComputeInstanceCatalogItems, {
      list: () => {
        options.onPublicList?.();
        return { items: [publicItem] };
      },
      update: (req) => {
        options.onPublicUpdate?.(req);
        return { object: publicItem };
      },
    });

    router.service(PrivateComputeInstanceCatalogItems, {
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

describe('useAdminComputeInstanceCatalogItems', () => {
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
      () => useAdminComputeInstanceCatalogItems(),
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
      () => useAdminComputeInstanceCatalogItems(),
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
      () => useAdminComputeInstanceCatalogItems({}, false),
      'providerAdmin',
      transport,
    );

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(privateListCalled).toBe(false);
    expect(publicListCalled).toBe(false);
  });
});

describe('useAdminSetComputeInstanceCatalogItemPublished', () => {
  it('sends the update with a published field mask to the private client for providerAdmin', async () => {
    let lastReq: unknown;
    const transport = createTestTransport({
      onPrivateUpdate: (req) => {
        lastReq = req;
      },
    });

    const { result } = renderWithSession(
      () => useAdminSetComputeInstanceCatalogItemPublished(),
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
      () => useAdminSetComputeInstanceCatalogItemPublished(),
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
