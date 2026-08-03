import React, { type ReactNode, createElement } from 'react';
import { createRouterTransport } from '@connectrpc/connect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { IdentityProviderPhase, IdentityProviders } from '@osac/types';

import { useIdentityProviders } from './identity-provider';
import { ApiProvider } from '../api-context';

const makeIdentityProvider = (id: string, title: string, phase?: IdentityProviderPhase) => ({
  id,
  spec: { title, enabled: true, config: { case: 'oidc' as const, value: {} } },
  status: phase !== undefined ? { phase, message: '', conditions: [] } : undefined,
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

describe('useIdentityProviders', () => {
  it('returns identity provider items from the list response', async () => {
    const transport = createRouterTransport((router) => {
      router.service(IdentityProviders, {
        list: () => ({
          items: [
            makeIdentityProvider('idp-1', 'Corporate OIDC', IdentityProviderPhase.READY),
            makeIdentityProvider('idp-2', 'GitHub SSO', IdentityProviderPhase.ERROR),
          ],
          size: 2,
          total: 2,
        }),
      });
    });

    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => useIdentityProviders(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].id).toBe('idp-1');
    expect(result.current.data?.[1].id).toBe('idp-2');
  });
});
