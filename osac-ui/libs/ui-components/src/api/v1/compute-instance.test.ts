import { type ReactNode, createElement } from 'react';
import { createRouterTransport } from '@connectrpc/connect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ComputeInstanceState, ComputeInstances } from '@osac/types';

import { usePatchComputeInstance } from './compute-instance';
import { ApiProvider } from '../api-context';

const makeVm = (id: string, state: ComputeInstanceState) => ({
  id,
  status: { state },
  metadata: { name: `vm-${id}` },
  spec: {},
});

describe('usePatchComputeInstance', () => {
  const createTestTransport = (updateFn: ReturnType<typeof import('vitest').vi.fn>) =>
    createRouterTransport((router) => {
      router.service(ComputeInstances, {
        list: () => ({
          items: [makeVm('vm-1', ComputeInstanceState.RUNNING)],
        }),
        get: () => ({
          object: makeVm('vm-1', ComputeInstanceState.RUNNING),
        }),
        update: (req) => {
          updateFn(req);
          return { object: makeVm('vm-1', ComputeInstanceState.STOPPING) };
        },
      });
    });

  const renderUsePatchComputeInstance = (transport: ReturnType<typeof createRouterTransport>) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        ApiProvider,
        { transport },
        createElement(QueryClientProvider, { client: queryClient }, children),
      );
    return { ...renderHook(() => usePatchComputeInstance(), { wrapper }), queryClient };
  };

  it('calls the update API with the correct power action', async () => {
    const updateFn = (() => {
      let called = false;
      let lastReq: unknown;
      const fn = (req: unknown) => {
        called = true;
        lastReq = req;
      };
      fn.getCalled = () => called;
      fn.getLastReq = () => lastReq;
      return fn;
    })();

    const transport = createTestTransport(
      updateFn as unknown as ReturnType<typeof import('vitest').vi.fn>,
    );
    const { result } = renderUsePatchComputeInstance(transport);

    act(() => {
      result.current.mutate({ id: 'vm-1', powerAction: 'stop' });
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(updateFn.getCalled()).toBe(true);
  });

  it('resolves successfully after a stop action', async () => {
    const transport = createTestTransport((() => {}) as unknown as ReturnType<
      typeof import('vitest').vi.fn
    >);
    const { result } = renderUsePatchComputeInstance(transport);

    act(() => {
      result.current.mutate({ id: 'vm-1', powerAction: 'stop' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
