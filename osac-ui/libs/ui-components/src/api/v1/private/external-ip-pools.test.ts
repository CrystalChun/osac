import React, { type ReactNode, createElement } from 'react';
import { create } from '@bufbuild/protobuf';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  ExternalIPPoolSchema,
  ExternalIPPoolState,
  ExternalIPPoolsCreateResponseSchema,
  ExternalIPPoolsUpdateResponseSchema,
  IPFamily,
} from '@osac/types/private';

import {
  invalidatePrivateExternalIPPoolsQueries,
  useCreateExternalIPPool,
  useDeleteExternalIPPool,
  usePrivateExternalIPPool,
  usePrivateExternalIPPools,
  useUpdateExternalIPPool,
} from './external-ip-pools';
import { createMockConnectTransport } from '../../../test-utils/createMockConnectTransport';
import { ApiProvider } from '../../api-context';

const makePool = (
  id: string,
  state: ExternalIPPoolState = ExternalIPPoolState.EXTERNAL_IP_POOL_STATE_READY,
) =>
  create(ExternalIPPoolSchema, {
    id,
    metadata: { name: `pool-${id}`, version: 1 },
    spec: {
      cidrs: ['192.168.1.0/24'],
      ipFamily: IPFamily.IP_FAMILY_IPV4,
      implementationStrategy: 'metallb-l2',
    },
    status: { state },
  });

const makeWrapper = (transport: ReturnType<typeof createMockConnectTransport>) => {
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

describe('usePrivateExternalIPPools', () => {
  it('returns pool items from the list response', async () => {
    const transport = createMockConnectTransport({
      privateExternalIpPools: [makePool('p-1'), makePool('p-2')],
    });
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => usePrivateExternalIPPools(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((p) => p.id)).toEqual(['p-1', 'p-2']);
  });
});

describe('usePrivateExternalIPPool', () => {
  it('returns a single pool from the get response', async () => {
    const transport = createMockConnectTransport({
      privateExternalIpPools: [makePool('p-1')],
    });
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => usePrivateExternalIPPool('p-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('p-1');
  });

  it('does not fetch when id is empty', () => {
    const transport = createMockConnectTransport({});
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => usePrivateExternalIPPool(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateExternalIPPool', () => {
  it('submits metadata.name and the full spec on create', async () => {
    let captured: Record<string, unknown> | undefined;
    const transport = createMockConnectTransport(
      {},
      {
        onExternalIPPoolCreate: (req) => {
          captured = req as unknown as Record<string, unknown>;
          return create(ExternalIPPoolsCreateResponseSchema, { object: makePool('new-1') });
        },
      },
    );
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => useCreateExternalIPPool(), { wrapper });

    act(() => {
      result.current.mutate({
        metadata: { name: 'pool-1' },
        spec: { cidrs: ['10.0.0.0/24'], ipFamily: IPFamily.IP_FAMILY_IPV4 },
      });
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(true);
    expect(captured?.object).toMatchObject({
      metadata: { name: 'pool-1' },
      spec: { cidrs: ['10.0.0.0/24'], ipFamily: IPFamily.IP_FAMILY_IPV4 },
    });
  });
});

describe('useUpdateExternalIPPool', () => {
  const mutateAndCaptureUpdate = async (
    input: Parameters<ReturnType<typeof useUpdateExternalIPPool>['mutate']>[0],
  ) => {
    let captured: Record<string, unknown> | undefined;
    const transport = createMockConnectTransport(
      { privateExternalIpPools: [makePool(input.id)] },
      {
        onExternalIPPoolUpdate: (req) => {
          captured = req as unknown as Record<string, unknown>;
          return create(ExternalIPPoolsUpdateResponseSchema, { object: makePool(input.id) });
        },
      },
    );
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => useUpdateExternalIPPool(), { wrapper });

    act(() => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(true);
    return captured;
  };

  it('masks only metadata.name and never spec fields', async () => {
    const captured = await mutateAndCaptureUpdate({ id: 'p-1', version: 3, name: 'renamed' });

    const paths = (captured?.updateMask as { paths?: string[] } | undefined)?.paths;
    expect(paths).toEqual(['metadata.name']);
    expect(paths).not.toContain('spec.cidrs');
    expect(paths).not.toContain('spec.ip_family');
  });

  it('sends the new name in object.metadata.name', async () => {
    const captured = await mutateAndCaptureUpdate({ id: 'p-1', version: 3, name: 'renamed' });

    const object = captured?.object as { metadata?: { name?: string } };
    expect(object.metadata?.name).toBe('renamed');
  });

  it('sends lock: true and the current version so the server can enforce the lock', async () => {
    const captured = await mutateAndCaptureUpdate({ id: 'p-1', version: 7, name: 'renamed' });

    expect(captured?.lock).toBe(true);
    const object = captured?.object as { metadata?: { version?: number } };
    expect(object.metadata?.version).toBe(7);
  });
});

describe('useDeleteExternalIPPool', () => {
  it('deletes a pool by id', async () => {
    const transport = createMockConnectTransport({
      privateExternalIpPools: [makePool('p-1')],
    });
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => useDeleteExternalIPPool(), { wrapper });

    act(() => {
      result.current.mutate('p-1');
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(true);
  });
});

describe('invalidatePrivateExternalIPPoolsQueries', () => {
  const asApiQueryClient = (qc: QueryClient) =>
    qc as unknown as Parameters<typeof invalidatePrivateExternalIPPoolsQueries>[0];

  it('invalidates both the list and by-id pool queries', async () => {
    const qc = new QueryClient();
    qc.setQueryData(['v1/private/external_ip_pools'], { items: [] });
    qc.setQueryData(['v1/private/external_ip_pools', ['p-1']], { id: 'p-1' });

    await invalidatePrivateExternalIPPoolsQueries(asApiQueryClient(qc));

    expect(qc.getQueryState(['v1/private/external_ip_pools'])?.isInvalidated).toBe(true);
    expect(qc.getQueryState(['v1/private/external_ip_pools', ['p-1']])?.isInvalidated).toBe(true);
  });
});
