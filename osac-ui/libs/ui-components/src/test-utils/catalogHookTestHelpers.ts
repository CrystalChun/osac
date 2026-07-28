import { createRouterTransport } from '@connectrpc/connect';
import type { ConnectRouter } from '@connectrpc/connect';
import type { UseQueryResult } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';

import { renderHookWithProviders } from './TestProviders';
import type { ListParams } from '../api/types';
import type { DemoShellRole } from '../shellTypes';

interface CatalogHookTestConfig<TItem> {
  /** Human-readable endpoint description used in the generated test name, e.g. "public ClusterCatalogItems". */
  endpointDescription: string;
  useHook: (params?: ListParams, enabled?: boolean) => UseQueryResult<TItem[], unknown>;
  role: DemoShellRole;
  item: TItem;
  /** Registers the mock service on the router; call `onList` when the List RPC is invoked. */
  registerList: (router: ConnectRouter, onList?: () => void) => void;
}

/**
 * Shared "fetches items from the List endpoint" + "does not fetch when disabled" test pair for the
 * per-kind catalog-item list hooks (public and private). Each call site keeps its own concretely-typed
 * `registerList` callback so the mock service registration stays fully type-checked against the real
 * Connect service descriptor.
 */
export const createCatalogHookTests = <TItem>({
  endpointDescription,
  useHook,
  role,
  item,
  registerList,
}: CatalogHookTestConfig<TItem>) => {
  it(`fetches items from the ${endpointDescription} List endpoint`, async () => {
    const transport = createRouterTransport((router) => registerList(router));

    const { result } = renderHookWithProviders(() => useHook(), { role, transport });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([item]);
  });

  it('does not fetch when disabled', async () => {
    let listCalled = false;
    const transport = createRouterTransport((router) =>
      registerList(router, () => {
        listCalled = true;
      }),
    );

    renderHookWithProviders(() => useHook({}, false), { role, transport });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(listCalled).toBe(false);
  });
};
