import React, { type ReactNode, createElement } from 'react';
import { create } from '@bufbuild/protobuf';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  StorageBackendSchema,
  StorageBackendState,
  StorageBackendsCreateResponseSchema,
  StorageBackendsUpdateResponseSchema,
} from '@osac/types/private';

import {
  STORAGE_BACKEND_READY_LIST_FILTER,
  invalidateStorageBackendsQueries,
  useCreateStorageBackend,
  useDeleteStorageBackend,
  usePrivateStorageBackend,
  usePrivateStorageBackends,
  useUpdateStorageBackend,
} from './storage-backends';
import { createMockConnectTransport } from '../../../test-utils/createMockConnectTransport';
import { ApiProvider } from '../../api-context';

const makeStorageBackend = (id: string, state: StorageBackendState = StorageBackendState.READY) =>
  create(StorageBackendSchema, {
    id,
    metadata: { name: `backend-${id}` },
    spec: {
      provider: 'vast',
      endpoint: `${id}.example.com`,
      description: '',
      credentials: { username: 'test-admin', password: 'test-secret' },
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

describe('STORAGE_BACKEND_READY_LIST_FILTER', () => {
  it('matches the ready-state CEL expression', () => {
    expect(STORAGE_BACKEND_READY_LIST_FILTER).toBe(
      `this.status.state == ${StorageBackendState.READY}`,
    );
  });
});

describe('usePrivateStorageBackends', () => {
  it('returns backend items from the list response', async () => {
    const transport = createMockConnectTransport({
      storageBackends: [makeStorageBackend('b-1'), makeStorageBackend('b-2')],
    });
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => usePrivateStorageBackends(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.map((b) => b.id)).toEqual(['b-1', 'b-2']);
  });

  it('excludes non-ready backends when filtered by STORAGE_BACKEND_READY_LIST_FILTER', async () => {
    const transport = createMockConnectTransport({
      storageBackends: [
        makeStorageBackend('ready-1', StorageBackendState.READY),
        makeStorageBackend('unspecified-1', StorageBackendState.UNSPECIFIED),
      ],
    });
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(
      () => usePrivateStorageBackends({ filter: STORAGE_BACKEND_READY_LIST_FILTER }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((b) => b.id)).toEqual(['ready-1']);
  });
});

describe('usePrivateStorageBackend', () => {
  it('returns a single backend from the get response', async () => {
    const transport = createMockConnectTransport({
      storageBackends: [makeStorageBackend('b-1')],
    });
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => usePrivateStorageBackend('b-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('b-1');
  });
});

describe('useCreateStorageBackend', () => {
  it('submits metadata.name and the full spec on create', async () => {
    let captured: Record<string, unknown> | undefined;
    const transport = createMockConnectTransport(
      {},
      {
        onStorageBackendCreate: (req) => {
          captured = req as unknown as Record<string, unknown>;
          return create(StorageBackendsCreateResponseSchema, {
            object: makeStorageBackend('new-1'),
          });
        },
      },
    );
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => useCreateStorageBackend(), { wrapper });

    act(() => {
      result.current.mutate({
        name: 'backend-1',
        provider: 'vast',
        endpoint: 'vast.example.com',
        description: 'primary array',
        credentials: { username: 'test-admin', password: 'test-secret' },
      });
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(true);
    expect(captured?.object).toMatchObject({
      metadata: { name: 'backend-1' },
      spec: {
        provider: 'vast',
        endpoint: 'vast.example.com',
        description: 'primary array',
        credentials: { username: 'test-admin', password: 'test-secret' },
      },
    });
  });
});

describe('useUpdateStorageBackend', () => {
  const mutateAndCaptureUpdate = async (
    input: Parameters<ReturnType<typeof useUpdateStorageBackend>['mutate']>[0],
  ) => {
    let captured: Record<string, unknown> | undefined;
    const transport = createMockConnectTransport(
      { storageBackends: [makeStorageBackend(input.id)] },
      {
        onStorageBackendUpdate: (req) => {
          captured = req as unknown as Record<string, unknown>;
          return create(StorageBackendsUpdateResponseSchema, {
            object: makeStorageBackend(input.id),
          });
        },
      },
    );
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => useUpdateStorageBackend(), { wrapper });

    act(() => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(true);
    return captured;
  };

  it('sends a single spec.endpoint mask entry and never masks metadata.name or spec.provider', async () => {
    const captured = await mutateAndCaptureUpdate({ id: 'b-1', endpoint: 'new.example.com' });

    const paths = (captured?.updateMask as { paths?: string[] } | undefined)?.paths;
    expect(paths).toEqual(['spec.endpoint']);
    expect(paths).not.toContain('metadata.name');
    expect(paths).not.toContain('spec.provider');
    const object = captured?.object as { metadata?: unknown };
    expect(object.metadata).toBeUndefined();
  });

  it('sends spec.endpoint and spec.description as separate mask entries when both change', async () => {
    const captured = await mutateAndCaptureUpdate({
      id: 'b-1',
      endpoint: 'new.example.com',
      description: 'updated description',
    });

    expect((captured?.updateMask as { paths?: string[] } | undefined)?.paths).toEqual([
      'spec.endpoint',
      'spec.description',
    ]);
  });

  it('sends a single spec.credentials mask entry, never split into username/password leaves', async () => {
    const captured = await mutateAndCaptureUpdate({
      id: 'b-1',
      credentials: { username: 'test-updated-admin', password: 'test-updated-secret' },
    });

    expect((captured?.updateMask as { paths?: string[] } | undefined)?.paths).toEqual([
      'spec.credentials',
    ]);
    const object = captured?.object as { spec?: { credentials?: unknown } };
    expect(object.spec?.credentials).toMatchObject({
      username: 'test-updated-admin',
      password: 'test-updated-secret',
    });
  });

  it('sets lock to true for optimistic concurrency', async () => {
    const captured = await mutateAndCaptureUpdate({ id: 'b-1', endpoint: 'new.example.com' });

    expect(captured?.lock).toBe(true);
  });

  it('rejects an update with no fields to change, without calling the RPC', async () => {
    let called = false;
    const transport = createMockConnectTransport(
      { storageBackends: [makeStorageBackend('b-1')] },
      {
        onStorageBackendUpdate: (_req) => {
          called = true;
          return create(StorageBackendsUpdateResponseSchema, {
            object: makeStorageBackend('b-1'),
          });
        },
      },
    );
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => useUpdateStorageBackend(), { wrapper });

    act(() => {
      result.current.mutate({ id: 'b-1' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(called).toBe(false);
  });
});

describe('useDeleteStorageBackend', () => {
  it('deletes a backend by id', async () => {
    const transport = createMockConnectTransport({
      storageBackends: [makeStorageBackend('b-1')],
    });
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => useDeleteStorageBackend(), { wrapper });

    act(() => {
      result.current.mutate('b-1');
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(true);
  });
});

describe('invalidateStorageBackendsQueries', () => {
  const asApiQueryClient = (qc: QueryClient) =>
    qc as unknown as Parameters<typeof invalidateStorageBackendsQueries>[0];

  it('invalidates both the list and by-id storage backend queries', async () => {
    const qc = new QueryClient();
    qc.setQueryData(['v1/private/storage_backends'], { items: [] });
    qc.setQueryData(['v1/private/storage_backends', ['b-1']], { id: 'b-1' });

    await invalidateStorageBackendsQueries(asApiQueryClient(qc));

    expect(qc.getQueryState(['v1/private/storage_backends'])?.isInvalidated).toBe(true);
    expect(qc.getQueryState(['v1/private/storage_backends', ['b-1']])?.isInvalidated).toBe(true);
  });
});
