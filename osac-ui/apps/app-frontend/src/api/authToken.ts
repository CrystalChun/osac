/**
 * Auth token helpers.
 *
 * The primary auth mechanism is now an HttpOnly session cookie managed by the Go proxy BFF.
 * All fetch calls use `credentials: 'include'` so the browser sends the cookie automatically;
 * the proxy injects `Authorization: Bearer` into upstream requests.
 *
 * The functions below are kept for dev-mode fallback only and will be removed once OIDC is
 * fully wired in all environments.
 * OSAC_WORKAROUND_REMOVE(session-storage-bearer): delete this file when done.
 */

const ACCESS_TOKEN_STORAGE_KEY = 'osac.accessToken'

/** @deprecated Use session cookie via credentials:include. Only used as dev fallback. */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  if (token?.trim()) return token.trim()
  // OSAC_WORKAROUND_REMOVE(vite-dev-bearer): remove when OIDC/session always provides a token.
  const devBearer = import.meta.env.DEV ? import.meta.env.VITE_DEV_BEARER_TOKEN?.trim() : undefined
  return devBearer || null
}

/** @deprecated Use session cookie via credentials:include. */
export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return
  const value = token.trim()
  if (!value) {
    window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
    return
  }
  window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, value)
}

/** @deprecated Cleared automatically by POST /api/logout. */
export function clearAccessToken(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
}
