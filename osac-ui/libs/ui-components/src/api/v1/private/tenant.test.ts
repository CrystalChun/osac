import React, { type ReactNode, createElement } from 'react';
import { createRouterTransport } from '@connectrpc/connect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Tenants as PrivateTenants } from '@osac/types/private';

import { useTenants } from './tenant';
import { ApiProvider } from '../../api-context';

const makeTenant = (id: string) => ({
  id,
  metadata: { name: `tenant-${id}` },
  spec: { domains: [`${id}.example.com`] },
});

const makeWrapper = (transport: ReturnType<typeof createRouterTransport>) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(
      ApiProvider,
      { transport } as React.ComponentProps<typeof ApiProvider>,
      createElement(QueryClientProvider, { client: queryClient }, children),
    );
  return { wrapper, queryClient };
};

describe('useTenants', () => {
  it('returns tenant items from the list response', async () => {
    const transport = createRouterTransport((router) => {
      router.service(PrivateTenants, {
        list: () => ({ items: [makeTenant('t-1'), makeTenant('t-2')], size: 2, total: 2 }),
        get: () => ({ object: makeTenant('t-1') }),
      });
    });

    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => useTenants(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].id).toBe('t-1');
  });
});
