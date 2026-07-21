import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComputeInstance } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';

import { useConsoleSession } from './useConsoleSession';

const mutateAsync = vi.fn();

vi.mock('../../../api/v1/console-session', () => ({
  buildConsoleSessionRequest: vi.fn(() => ({
    resourceType: 1,
    resourceId: 'vm-1',
    type: 2,
    clientId: 'client-id',
  })),
  useCreateConsoleSession: () => ({
    mutateAsync,
    isPending: false,
  }),
}));

vi.mock('./console-websocket', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./console-websocket')>();
  return {
    ...actual,
    clearConsoleTicketCookie: vi.fn(),
    openConsoleWebSocket: vi.fn(),
    setConsoleTicketCookie: vi.fn(),
  };
});

const { clearConsoleTicketCookie, openConsoleWebSocket, setConsoleTicketCookie } =
  await import('./console-websocket');

const createMockWebSocket = ({ autoOpen = true }: { autoOpen?: boolean } = {}) => {
  const listeners = new Map<string, Array<(event?: CloseEvent) => void>>();

  return {
    close: vi.fn(),
    addEventListener: vi.fn((event: string, listener: (event?: CloseEvent) => void) => {
      const handlers = listeners.get(event) ?? [];
      handlers.push(listener);
      listeners.set(event, handlers);

      if (event === 'open' && autoOpen) {
        queueMicrotask(listener);
      }
    }),
    dispatchEvent: (event: string, payload?: CloseEvent) => {
      listeners.get(event)?.forEach((listener) => listener(payload));
    },
  };
};

const runningVm = {
  id: 'vm-1',
  status: { state: ComputeInstanceState.RUNNING },
} as ComputeInstance;

const stoppedVm = {
  id: 'vm-1',
  status: { state: ComputeInstanceState.STOPPED },
} as ComputeInstance;

describe('useConsoleSession', () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    vi.mocked(setConsoleTicketCookie).mockReset();
    vi.mocked(clearConsoleTicketCookie).mockReset();
    vi.mocked(openConsoleWebSocket).mockReset();
    vi.stubGlobal('crypto', {
      randomUUID: () => 'client-id',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports the VM as not running when it is stopped', () => {
    const { result } = renderHook(() => useConsoleSession(stoppedVm, 'vnc'));

    expect(result.current.isVmRunning).toBe(false);
  });

  it('auto-connects when the VM is running', async () => {
    const webSocket = createMockWebSocket();
    mutateAsync.mockResolvedValue({ ticket: 'ticket-value' });
    vi.mocked(openConsoleWebSocket).mockReturnValue(webSocket as unknown as WebSocket);

    const { result } = renderHook(() => useConsoleSession(runningVm, 'vnc'));

    await waitFor(() => expect(result.current.connectionState).toBe('connected'));
    expect(mutateAsync).toHaveBeenCalled();
    expect(setConsoleTicketCookie).toHaveBeenCalledWith('ticket-value');
    expect(openConsoleWebSocket).toHaveBeenCalled();
  });

  it('cleans up the WebSocket on unmount', async () => {
    const webSocket = createMockWebSocket();
    mutateAsync.mockResolvedValue({ ticket: 'ticket-value' });
    vi.mocked(openConsoleWebSocket).mockReturnValue(webSocket as unknown as WebSocket);

    const { result, unmount } = renderHook(() => useConsoleSession(runningVm, 'serial'));

    await waitFor(() => expect(result.current.connectionState).toBe('connected'));

    unmount();

    expect(webSocket.close).toHaveBeenCalled();
    expect(clearConsoleTicketCookie).toHaveBeenCalled();
  });

  it('surfaces ticket creation errors', async () => {
    mutateAsync.mockRejectedValue(new Error('insufficient permissions'));

    const { result } = renderHook(() => useConsoleSession(runningVm, 'vnc'));

    await waitFor(() => expect(result.current.connectionState).toBe('error'));
    expect(result.current.errorMessage).toBe('insufficient permissions');
    expect(openConsoleWebSocket).not.toHaveBeenCalled();
  });

  it('surfaces WebSocket close while still connecting', async () => {
    const webSocket = createMockWebSocket({ autoOpen: false });
    mutateAsync.mockResolvedValue({ ticket: 'ticket-value' });
    vi.mocked(openConsoleWebSocket).mockReturnValue(webSocket as unknown as WebSocket);

    const { result } = renderHook(() => useConsoleSession(runningVm, 'vnc'));

    await waitFor(() => expect(result.current.connectionState).toBe('connecting'));

    act(() => {
      webSocket.dispatchEvent('close', { code: 1002, reason: '' } as CloseEvent);
    });

    await waitFor(() => expect(result.current.connectionState).toBe('error'));
    expect(result.current.errorMessage).toBe(
      'WebSocket closed before the console connected (code 1002)',
    );
  });

  it('surfaces unexpected WebSocket close errors', async () => {
    const webSocket = createMockWebSocket();
    mutateAsync.mockResolvedValue({ ticket: 'ticket-value' });
    vi.mocked(openConsoleWebSocket).mockReturnValue(webSocket as unknown as WebSocket);

    const { result } = renderHook(() => useConsoleSession(runningVm, 'vnc'));

    await waitFor(() => expect(result.current.connectionState).toBe('connected'));

    act(() => {
      webSocket.dispatchEvent('close', { code: 1006, reason: '' } as CloseEvent);
    });

    await waitFor(() => expect(result.current.connectionState).toBe('error'));
    expect(result.current.errorMessage).toBe('Console connection was closed unexpectedly');
  });

  it('reports viewer load failures', () => {
    const { result } = renderHook(() => useConsoleSession(runningVm, 'vnc'));

    act(() => {
      result.current.reportViewerError('Failed to load graphical console viewer');
    });

    expect(result.current.connectionState).toBe('error');
    expect(result.current.errorMessage).toBe('Failed to load graphical console viewer');
  });
});
