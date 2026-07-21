import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CONSOLE_CLIENT_ID_STORAGE_KEY,
  CONSOLE_TICKET_COOKIE_PATH,
  clearConsoleTicketCookie,
  getConsoleClientId,
  getConsoleWebSocketUrl,
  getWebSocketCloseErrorMessage,
  openConsoleWebSocket,
  setConsoleTicketCookie,
} from './console-websocket';

describe('console-websocket', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds a wss URL when the page is served over https', () => {
    vi.stubGlobal('window', {
      location: {
        protocol: 'https:',
        host: 'console.example.com',
      },
    });

    expect(getConsoleWebSocketUrl()).toBe(
      'wss://console.example.com/api/fulfillment/v1/console_sessions/connect',
    );
  });

  it('sets the console-ticket cookie on the scoped path', () => {
    vi.stubGlobal('window', {
      location: {
        protocol: 'https:',
        host: 'console.example.com',
      },
    });

    setConsoleTicketCookie('ticket-value');

    expect(document.cookie).toContain('console-ticket=ticket-value');
    expect(document.cookie).toContain(`path=${CONSOLE_TICKET_COOKIE_PATH}`);
    expect(document.cookie).toContain('SameSite=Strict');
    expect(document.cookie).toContain('Secure');
  });

  it('clears the console-ticket cookie', () => {
    clearConsoleTicketCookie();

    expect(document.cookie).toContain('console-ticket=');
    expect(document.cookie).toContain('Max-Age=0');
    expect(document.cookie).toContain(`path=${CONSOLE_TICKET_COOKIE_PATH}`);
  });

  it('opens a WebSocket with the binary subprotocol', () => {
    const webSocketCtor = vi.fn();
    vi.stubGlobal('WebSocket', webSocketCtor);
    vi.stubGlobal('window', {
      location: {
        protocol: 'http:',
        host: 'localhost:5173',
      },
    });

    openConsoleWebSocket();

    expect(webSocketCtor).toHaveBeenCalledWith(
      'ws://localhost:5173/api/fulfillment/v1/console_sessions/connect',
      ['binary'],
    );
  });

  it('describes WebSocket close failures', () => {
    expect(getWebSocketCloseErrorMessage({ code: 1006, reason: '' } as CloseEvent, false)).toBe(
      'Console connection was closed unexpectedly',
    );
    expect(getWebSocketCloseErrorMessage({ code: 1002, reason: '' } as CloseEvent, true)).toBe(
      'WebSocket closed before the console connected (code 1002)',
    );
    expect(
      getWebSocketCloseErrorMessage(
        { code: 1008, reason: 'origin not allowed' } as CloseEvent,
        false,
      ),
    ).toBe('origin not allowed');
  });

  it('reuses a single console client id for the browser tab', () => {
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn().mockReturnValueOnce('id-1').mockReturnValueOnce('id-2'),
    });

    const first = getConsoleClientId();
    const second = getConsoleClientId();

    expect(first).toBe('id-1');
    expect(second).toBe('id-1');
    expect(sessionStorage.getItem(CONSOLE_CLIENT_ID_STORAGE_KEY)).toBe('id-1');
  });
});
