package middleware

import (
	"net/http"
	"strings"
)

const consoleTicketCookieName = "console-ticket"

// ConsoleWebSocketAuth prepares console WebSocket upgrade requests for console-proxy.
//
// Browsers cannot set Authorization on WebSocket, so the UI stores the ticket in a
// cookie. console-proxy prefers Authorization over the cookie and validates Origin
// for cookie-only auth. This middleware runs on the trusted UI proxy only:
//   - Promote console-ticket cookie to Authorization: Bearer <ticket>
//   - Clear Origin so console-proxy uses bearer-ticket auth (no CSWSH Origin gate)
//
// Do not compose with Auth middleware, which would replace the ticket with the OIDC
// access token.
func ConsoleWebSocketAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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
