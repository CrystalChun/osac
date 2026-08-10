import React, { type ReactNode, createElement } from 'react';
import { create } from '@bufbuild/protobuf';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  InstanceTypeSchema,
  InstanceTypeState,
  type InstanceType as PrivateInstanceType,
} from '@osac/types/private';

import { useAdminInstanceTypes } from './instance-type';
import { createMockConnectTransport } from '../../../test-utils/createMockConnectTransport';
import { ApiProvider } from '../../api-context';

const makeInstanceType = (
  id: string,
  state: InstanceTypeState = InstanceTypeState.ACTIVE,
): PrivateInstanceType =>
  create(InstanceTypeSchema, {
    id,
    metadata: { name: `instance-type-${id}` },
    spec: {
      description: `${id} description`,
      cores: 4,
      memoryGib: 16,
      state,
    },
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

describe('useAdminInstanceTypes', () => {
  it('returns all private instance type items from the list response', async () => {
    const transport = createMockConnectTransport({
      privateInstanceTypes: [
        makeInstanceType('active-1', InstanceTypeState.ACTIVE),
        makeInstanceType('deprecated-1', InstanceTypeState.DEPRECATED),
      ],
    });
    const { wrapper } = makeWrapper(transport);
    const { result } = renderHook(() => useAdminInstanceTypes(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((item) => item.id)).toEqual(['active-1', 'deprecated-1']);
  });

  it('stores query results under the private instance type cache key', async () => {
    const transport = createMockConnectTransport({
      privateInstanceTypes: [makeInstanceType('active-1')],
    });
    const { wrapper, queryClient } = makeWrapper(transport);
    const { result } = renderHook(() => useAdminInstanceTypes(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['v1/private/instance_types'])).toBeDefined();
    expect(queryClient.getQueryData(['v1/instance_types'])).toBeUndefined();
  });
});
