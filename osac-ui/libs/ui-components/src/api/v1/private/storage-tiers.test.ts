import React, { type ReactNode, createElement } from 'react';
import { create } from '@bufbuild/protobuf';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StorageProtocol, StorageTierSchema, StorageTierState } from '@osac/types/private';

import { usePrivateStorageTier, usePrivateStorageTiers } from './storage-tiers';
import { createMockConnectTransport } from '../../../test-utils/createMockConnectTransport';
import { ApiProvider } from '../../api-context';

const makeStorageTier = (id: string, state: StorageTierState = StorageTierState.ACTIVE) =>
  create(StorageTierSchema, {
    id,
    metadata: { name: `tier-${id}` },
    spec: {
      description: '',
      backends: [
        {
          backendId: 'b-1',
          protocol: StorageProtocol.NFS,
          maxReadBandwidthMbs: 100,
          maxWriteBandwidthMbs: 100,
          quotaGib: 500n,
          encryptionEnabled: false,
        },
      ],
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

describe('usePrivateStorageTiers', () => {
  it('returns tier items from the list response', async () => {
    const transport = createMockConnectTransport({
      storageTiers: [makeStorageTier('t-1'), makeStorageTier('t-2')],
    });
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => usePrivateStorageTiers(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.map((t) => t.id)).toEqual(['t-1', 't-2']);
  });
});

describe('usePrivateStorageTier', () => {
  it('returns a single tier from the get response', async () => {
    const transport = createMockConnectTransport({
      storageTiers: [makeStorageTier('t-1')],
    });
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => usePrivateStorageTier('t-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('t-1');
  });

  it('does not fetch when id is falsy', () => {
    const transport = createMockConnectTransport({
      storageTiers: [makeStorageTier('t-1')],
    });
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => usePrivateStorageTier(''), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });
});
