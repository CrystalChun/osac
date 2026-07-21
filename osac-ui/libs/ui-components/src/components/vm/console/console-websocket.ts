export const CONSOLE_TICKET_COOKIE_NAME = 'console-ticket';
export const CONSOLE_TICKET_COOKIE_PATH = '/api/fulfillment/v1/console_sessions';
export const CONSOLE_CLIENT_ID_STORAGE_KEY = 'osac-console-client';

const CONSOLE_CONNECT_PATH = '/api/fulfillment/v1/console_sessions/connect';

/**
 * Stable per-tab client id so console-proxy can evict a stale session after an
 * unclean disconnect. A new UUID on every mount would hit "already has an
 * active console session" (HTTP 502) on the next open. One id for the whole
 * tab is enough — server sessions are keyed by VM endpoint, not by client id.
 */
export const getConsoleClientId = (): string => {
  try {
    const existing = sessionStorage.getItem(CONSOLE_CLIENT_ID_STORAGE_KEY);
    if (existing) {
      return existing;
    }
    const id = crypto.randomUUID();
    sessionStorage.setItem(CONSOLE_CLIENT_ID_STORAGE_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
};

export const getConsoleWebSocketUrl = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${CONSOLE_CONNECT_PATH}`;
};

export const setConsoleTicketCookie = (ticket: string): void => {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSOLE_TICKET_COOKIE_NAME}=${ticket}; path=${CONSOLE_TICKET_COOKIE_PATH}; SameSite=Strict${secure}`;
};

export const clearConsoleTicketCookie = (): void => {
  document.cookie = `${CONSOLE_TICKET_COOKIE_NAME}=; Max-Age=0; path=${CONSOLE_TICKET_COOKIE_PATH}`;
};

export const openConsoleWebSocket = (): WebSocket =>
  new WebSocket(getConsoleWebSocketUrl(), ['binary']);

export const getWebSocketCloseErrorMessage = (
  event: CloseEvent,
  wasConnecting: boolean,
): string => {
  if (event.reason) {
    return event.reason;
  }

  if (wasConnecting) {
    return `WebSocket closed before the console connected (code ${event.code})`;
  }

  if (event.code === 1006) {
    return 'Console connection was closed unexpectedly';
  }

  return `Console connection closed (code ${event.code})`;
};
