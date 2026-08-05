import React, { type ReactNode, createElement } from 'react';
import { create } from '@bufbuild/protobuf';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StorageBackendSchema, StorageBackendState } from '@osac/types/private';

import {
  STORAGE_BACKEND_READY_LIST_FILTER,
  usePrivateStorageBackend,
  usePrivateStorageBackends,
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
      credentials: { username: 'admin', password: 'secret' },
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
