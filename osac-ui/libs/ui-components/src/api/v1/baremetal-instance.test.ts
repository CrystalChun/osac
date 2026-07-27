import React, { type ReactNode, createElement } from 'react';
import { createRouterTransport } from '@connectrpc/connect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { BareMetalInstanceCatalogItem } from '@osac/types';
import { BareMetalInstanceCatalogItems, BareMetalInstanceRunStrategy, BareMetalInstances } from '@osac/types';

import {
  type PatchBareMetalInstanceInput,
  useBareMetalInstanceCatalogItems,
  usePatchBareMetalInstance,
} from './baremetal-instance';
import { ApiProvider } from '../api-context';
import { renderHookWithProviders } from '../../test-utils/TestProviders';

const item: BareMetalInstanceCatalogItem = {
  $typeName: 'osac.public.v1.BareMetalInstanceCatalogItem',
  id: 'public-1',
  title: 'Public bare metal item',
  description: '',
  template: '',
  published: true,
  fieldDefinitions: [],
};

describe('useBareMetalInstanceCatalogItems', () => {
  it('fetches items from the public BareMetalInstanceCatalogItems List endpoint', async () => {
    const transport = createRouterTransport((router) => {
      router.service(BareMetalInstanceCatalogItems, { list: () => ({ items: [item] }) });
    });

    const { result } = renderHookWithProviders(() => useBareMetalInstanceCatalogItems(), {
      role: 'tenantAdmin',
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

    renderHookWithProviders(() => useBareMetalInstanceCatalogItems({}, false), {
      role: 'tenantAdmin',
      transport,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(listCalled).toBe(false);
  });
});

const makeBmi = (id: string) => ({
  id,
  metadata: { name: `bmi-${id}` },
  spec: {
    catalogItem: 'catalog-1',
    runStrategy: BareMetalInstanceRunStrategy.ALWAYS,
    restartTrigger: 0n,
  },
  status: {},
});

describe('usePatchBareMetalInstance', () => {
  const createTestTransport = (updateFn: (req: unknown) => void) =>
    createRouterTransport((router) => {
      router.service(BareMetalInstances, {
        list: () => ({ items: [makeBmi('bmi-1')] }),
        get: () => ({ object: makeBmi('bmi-1') }),
        update: (req) => {
          updateFn(req);
          return { object: makeBmi('bmi-1') };
        },
      });
    });

  const renderUsePatch = (transport: ReturnType<typeof createRouterTransport>) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        ApiProvider,
        { transport } as React.ComponentProps<typeof ApiProvider>,
        createElement(QueryClientProvider, { client: queryClient }, children),
      );
    return { ...renderHook(() => usePatchBareMetalInstance(), { wrapper }), queryClient };
  };

  const mutateAndCapture = async (input: PatchBareMetalInstanceInput) => {
    let captured: Record<string, unknown> | undefined;
    const transport = createTestTransport((req) => {
      captured = req as Record<string, unknown>;
    });
    const { result } = renderUsePatch(transport);

    act(() => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(true);
    return captured;
  };

  it('sends updateMask with spec.run_strategy for stop action', async () => {
    const req = await mutateAndCapture({ id: 'bmi-1', action: 'stop' });
    expect(req).toBeDefined();
    expect((req as { updateMask?: { paths: string[] } }).updateMask?.paths).toEqual([
      'spec.run_strategy',
    ]);
  });

  it('sends updateMask with spec.run_strategy for start action', async () => {
    const req = await mutateAndCapture({ id: 'bmi-1', action: 'start' });
    expect(req).toBeDefined();
    expect((req as { updateMask?: { paths: string[] } }).updateMask?.paths).toEqual([
      'spec.run_strategy',
    ]);
  });

  it('sends updateMask with spec.restart_trigger for restart action', async () => {
    const req = await mutateAndCapture({ id: 'bmi-1', action: 'restart', currentTrigger: 0n });
    expect(req).toBeDefined();
    expect((req as { updateMask?: { paths: string[] } }).updateMask?.paths).toEqual([
      'spec.restart_trigger',
    ]);
  });

  it('sets run_strategy to HALTED for stop action', async () => {
    const req = await mutateAndCapture({ id: 'bmi-1', action: 'stop' });
    const object = (req as { object?: { spec?: { runStrategy?: number } } }).object;
    expect(object?.spec?.runStrategy).toBe(BareMetalInstanceRunStrategy.HALTED);
  });

  it('sets run_strategy to ALWAYS for start action', async () => {
    const req = await mutateAndCapture({ id: 'bmi-1', action: 'start' });
    const object = (req as { object?: { spec?: { runStrategy?: number } } }).object;
    expect(object?.spec?.runStrategy).toBe(BareMetalInstanceRunStrategy.ALWAYS);
  });

  it('increments restart_trigger for restart action', async () => {
    const req = await mutateAndCapture({ id: 'bmi-1', action: 'restart', currentTrigger: 3n });
    const object = (req as { object?: { spec?: { restartTrigger?: bigint } } }).object;
    expect(object?.spec?.restartTrigger).toBe(4n);
  });
});
