import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConsoleResourceType, ConsoleType } from '@osac/types';

import { buildConsoleSessionRequest, useCreateConsoleSession } from './console-session';

const createMock = vi.fn();

vi.mock('../api-context', () => ({
  useApiFetch: () => ({
    create: createMock,
  }),
}));

describe('buildConsoleSessionRequest', () => {
  it('maps serial console type to protobuf enum', () => {
    expect(buildConsoleSessionRequest('vm-1', 'serial', 'client-uuid')).toEqual({
      resourceType: ConsoleResourceType.COMPUTE_INSTANCE,
      resourceId: 'vm-1',
      type: ConsoleType.SERIAL,
      clientId: 'client-uuid',
    });
  });

  it('maps vnc console type to protobuf enum', () => {
    expect(buildConsoleSessionRequest('vm-2', 'vnc', 'client-uuid')).toEqual({
      resourceType: ConsoleResourceType.COMPUTE_INSTANCE,
      resourceId: 'vm-2',
      type: ConsoleType.VNC,
      clientId: 'client-uuid',
    });
  });
});

describe('useCreateConsoleSession', () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
  );

  it('calls ConsoleSessions.create with the session request shape', async () => {
    createMock.mockResolvedValue({
      object: {
        resourceType: ConsoleResourceType.COMPUTE_INSTANCE,
        resourceId: 'vm-1',
        type: ConsoleType.VNC,
        clientId: 'client-uuid',
        ticket: 'encrypted-ticket',
      },
    });

    const { result } = renderHook(() => useCreateConsoleSession(), { wrapper });
    result.current.mutate(buildConsoleSessionRequest('vm-1', 'vnc', 'client-uuid'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createMock).toHaveBeenCalledWith({
      object: {
        resourceType: ConsoleResourceType.COMPUTE_INSTANCE,
        resourceId: 'vm-1',
        type: ConsoleType.VNC,
        clientId: 'client-uuid',
      },
    });
    expect(result.current.data?.ticket).toBe('encrypted-ticket');
  });
});
