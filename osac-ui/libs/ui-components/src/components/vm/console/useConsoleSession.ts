// @refresh reload — hook signature changes in this module cannot be Fast-Refreshed safely
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ComputeInstance } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';

import {
  clearConsoleTicketCookie,
  getConsoleClientId,
  getWebSocketCloseErrorMessage,
  openConsoleWebSocket,
  setConsoleTicketCookie,
} from './console-websocket';
import type { ConsoleUiConnectionState, VmConsoleType } from './console.types';
import {
  buildConsoleSessionRequest,
  useCreateConsoleSession,
} from '../../../api/v1/console-session';

export interface UseConsoleSessionResult {
  connectionState: ConsoleUiConnectionState;
  errorMessage: string | null;
  isVmRunning: boolean;
  reportViewerError: (message: string) => void;
  webSocket: WebSocket | null;
}

interface ConsoleSessionRefs {
  connect: (() => Promise<void>) | null;
  connectionState: ConsoleUiConnectionState;
  disconnect: (() => void) | null;
  intentionalClose: boolean;
  webSocket: WebSocket | null;
}

export const useConsoleSession = (
  vm: ComputeInstance,
  consoleType: VmConsoleType,
): UseConsoleSessionResult => {
  const createSession = useCreateConsoleSession();
  // Single ref object — do not add more useRef/useState here; HMR cannot recover from
  // hook-order changes mid-session (see Rules of Hooks / Fast Refresh).
  const sessionRef = useRef<ConsoleSessionRefs>({
    connect: null,
    connectionState: 'idle',
    disconnect: null,
    intentionalClose: false,
    webSocket: null,
  });
  const [connectionState, setConnectionState] = useState<ConsoleUiConnectionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

  const isVmRunning = vm.status?.state === ComputeInstanceState.RUNNING;

  const setConnectionStateAndRef = useCallback((state: ConsoleUiConnectionState) => {
    sessionRef.current.connectionState = state;
    setConnectionState(state);
  }, []);

  const closeWebSocket = useCallback(() => {
    sessionRef.current.intentionalClose = true;
    const socket = sessionRef.current.webSocket;
    sessionRef.current.webSocket = null;
    setWebSocket(null);
    clearConsoleTicketCookie();
    // Close after clearing the ref so the async `close` event is ignored as stale.
    socket?.close();
  }, []);

  const disconnect = useCallback(() => {
    closeWebSocket();
    setConnectionStateAndRef('disconnected');
    setErrorMessage(null);
    // Keep intentionalClose=true until the WebSocket `close` event clears it.
  }, [closeWebSocket, setConnectionStateAndRef]);

  const reportViewerError = useCallback(
    (message: string) => {
      setConnectionStateAndRef('error');
      setErrorMessage(message);
    },
    [setConnectionStateAndRef],
  );

  const connect = useCallback(async () => {
    if (!isVmRunning) {
      return;
    }

    closeWebSocket();
    sessionRef.current.intentionalClose = false;
    setConnectionStateAndRef('connecting');
    setErrorMessage(null);

    try {
      const session = await createSession.mutateAsync(
        buildConsoleSessionRequest(vm.id, consoleType, getConsoleClientId()),
      );

      if (!session.ticket) {
        throw new Error('Console session ticket was not returned');
      }

      setConsoleTicketCookie(session.ticket);
      const socket = openConsoleWebSocket();
      sessionRef.current.webSocket = socket;
      setWebSocket(socket);

      socket.addEventListener('open', () => {
        setConnectionStateAndRef('connected');
      });
      socket.addEventListener('close', (event) => {
        if (sessionRef.current.webSocket !== socket) {
          return;
        }

        sessionRef.current.webSocket = null;
        setWebSocket(null);
        clearConsoleTicketCookie();

        if (sessionRef.current.intentionalClose) {
          sessionRef.current.intentionalClose = false;
          return;
        }

        const wasConnecting = sessionRef.current.connectionState === 'connecting';
        setConnectionStateAndRef('error');
        setErrorMessage(getWebSocketCloseErrorMessage(event, wasConnecting));
      });
      socket.addEventListener('error', () => {
        setConnectionStateAndRef('error');
        setErrorMessage('Console connection failed');
      });
    } catch (error) {
      clearConsoleTicketCookie();
      setConnectionStateAndRef('error');
      setErrorMessage(error instanceof Error ? error.message : 'Console connection failed');
    }
  }, [closeWebSocket, consoleType, createSession, isVmRunning, setConnectionStateAndRef, vm.id]);

  sessionRef.current.connect = connect;
  sessionRef.current.disconnect = disconnect;

  // Auto-connect while the VM is running. Cleanup disconnects on unmount / deps change
  // (including React Strict Mode's mount → cleanup → mount cycle) so the remount reconnects.
  useEffect(() => {
    if (!isVmRunning) {
      return;
    }

    void sessionRef.current.connect?.();
    return () => {
      sessionRef.current.disconnect?.();
    };
  }, [consoleType, isVmRunning, vm.id]);

  return useMemo(
    () => ({
      connectionState,
      errorMessage,
      isVmRunning,
      reportViewerError,
      webSocket,
    }),
    [connectionState, errorMessage, isVmRunning, reportViewerError, webSocket],
  );
};
