package middleware

import (
	"net/http"
	"net/url"
	"strings"
)

const consoleTicketCookieName = "console-ticket"

// ConsoleWebSocketAuth prepares console WebSocket upgrade requests for console-proxy.
//
// Browsers cannot set Authorization on WebSocket, so the UI stores the ticket in a
// cookie. console-proxy prefers Authorization over the cookie and validates Origin
// for cookie-only auth. This middleware runs on the trusted UI proxy only:
//   - Reject requests whose Origin does not match the public UI origin. SameSite=Strict
//     still allows same-site cross-origin requests, so a hostile sibling origin could
//     otherwise ride the ticket cookie here and have Origin stripped for it below.
//   - Promote console-ticket cookie to Authorization: Bearer <ticket>
//   - Clear Origin so console-proxy uses bearer-ticket auth (no CSWSH Origin gate)
//
// baseUIURL is the public base URL of the UI (config.BaseUIURL); when empty, the
// request's own Host is used as the expected origin.
//
// Do not compose with Auth middleware, which would replace the ticket with the OIDC
// access token.
func ConsoleWebSocketAuth(baseUIURL string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !isTrustedOrigin(r, baseUIURL) {
				http.Error(w, "origin not allowed", http.StatusForbidden)
				return
			}

			r.Header.Del("Authorization")

			if cookie, err := r.Cookie(consoleTicketCookieName); err == nil {
				if ticket := strings.TrimSpace(cookie.Value); ticket != "" {
					r.Header.Set("Authorization", "Bearer "+ticket)
				}
			}

			r.Header.Del("Origin")
			r.Header.Del("Referer")

			next.ServeHTTP(w, r)
		})
	}
}

// isTrustedOrigin reports whether the request's Origin header matches the public UI
// origin. Browsers always send Origin on WebSocket upgrades, so an absent or
// mismatched Origin is rejected rather than silently proxied.
func isTrustedOrigin(r *http.Request, baseUIURL string) bool {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return false
	}
	originURL, err := url.Parse(origin)
	if err != nil || originURL.Host == "" {
		return false
	}

	expectedHost := r.Host
	if baseUIURL != "" {
		if base, err := url.Parse(baseUIURL); err == nil && base.Host != "" {
			expectedHost = base.Host
		}
	}

	return strings.EqualFold(originURL.Host, expectedHost)
}
