package bridge

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
)

// ConsoleTicketCookieName is the cookie carrying the console session ticket.
// Must match consoleTicketCookieName in middleware/consolews.go, which reads
// it back and promotes it to Authorization for the WebSocket upgrade.
const ConsoleTicketCookieName = "console-ticket"

// ConsoleTicketCookiePath scopes the cookie to the console-sessions API, so
// the browser only ever sends it to endpoints that need it.
const ConsoleTicketCookiePath = "/api/fulfillment/v1/console_sessions"

// WrapConsoleSessionCreate rewrites the ConsoleSessions.Create response so the
// ticket travels to the browser only as an HttpOnly cookie, never in the JSON
// body. Cookies set via document.cookie in the browser can never be HttpOnly —
// only a Set-Cookie response header can do that — so this must happen here,
// not in the frontend. Mount this only on the exact Create route; it does not
// re-check path or method itself.
func WrapConsoleSessionCreate(next http.Handler, baseUIURL string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rec := httptest.NewRecorder()
		next.ServeHTTP(rec, r)

		ticket, rewrittenBody, ok := extractAndStripTicket(rec)
		if !ok {
			copyRecordedResponse(w, rec)
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:     ConsoleTicketCookieName,
			Value:    ticket,
			Path:     ConsoleTicketCookiePath,
			HttpOnly: true,
			Secure:   isHTTPSRequest(r, baseUIURL),
			SameSite: http.SameSiteStrictMode,
		})

		header := w.Header()
		for k, v := range rec.Header() {
			header[k] = v
		}
		header.Del("Content-Length")
		w.WriteHeader(rec.Code)
		_, _ = w.Write(rewrittenBody)
	})
}

// extractAndStripTicket returns the ticket and a copy of the response body
// with "ticket" removed from the object payload, when the recorded response
// is a successful JSON ConsoleSessionsCreateResponse carrying a ticket. ok is
// false for anything else (errors, non-JSON, missing ticket) — callers must
// pass the response through unchanged in that case.
func extractAndStripTicket(rec *httptest.ResponseRecorder) (ticket string, body []byte, ok bool) {
	if rec.Code != http.StatusOK {
		return "", nil, false
	}
	if !strings.HasPrefix(rec.Header().Get("Content-Type"), "application/json") {
		return "", nil, false
	}

	var payload struct {
		Object map[string]any `json:"object"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil || payload.Object == nil {
		return "", nil, false
	}

	rawTicket, hasTicket := payload.Object["ticket"].(string)
	if !hasTicket || rawTicket == "" {
		return "", nil, false
	}

	delete(payload.Object, "ticket")
	rewritten, err := json.Marshal(payload)
	if err != nil {
		return "", nil, false
	}

	return rawTicket, rewritten, true
}

func copyRecordedResponse(w http.ResponseWriter, rec *httptest.ResponseRecorder) {
	header := w.Header()
	for k, v := range rec.Header() {
		header[k] = v
	}
	w.WriteHeader(rec.Code)
	_, _ = w.Write(rec.Body.Bytes())
}

// isHTTPSRequest reports whether the browser's request to the UI arrived over
// HTTPS, so the ticket cookie can be marked Secure accordingly. Mirrors the
// scheme-detection reasoning in middleware/consolews.go's isTrustedOrigin:
// this proxy always terminates plain HTTP behind a TLS-terminating
// ingress/Route, so r.TLS alone is not a reliable signal — prefer the
// configured public base URL, then the proxy's X-Forwarded-Proto header.
func isHTTPSRequest(r *http.Request, baseUIURL string) bool {
	if baseUIURL != "" && strings.HasPrefix(strings.ToLower(baseUIURL), "https://") {
		return true
	}
	if strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https") {
		return true
	}
	return r.TLS != nil
}

// NewClearConsoleTicketCookieHandler returns a handler that deletes the
// console-ticket cookie by responding with an already-expired Set-Cookie for
// it. It performs no upstream call — an HttpOnly cookie can no longer be
// deleted via document.cookie once set server-side, so the frontend calls
// this endpoint instead wherever it used to clear the cookie directly. Safe
// to leave unauthenticated: it can only delete a cookie the caller can
// neither read nor use, so it grants nothing.
func NewClearConsoleTicketCookieHandler(baseUIURL string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		http.SetCookie(w, &http.Cookie{
			Name:     ConsoleTicketCookieName,
			Value:    "",
			Path:     ConsoleTicketCookiePath,
			MaxAge:   -1,
			HttpOnly: true,
			Secure:   isHTTPSRequest(r, baseUIURL),
			SameSite: http.SameSiteStrictMode,
		})
		w.WriteHeader(http.StatusNoContent)
	}
}
