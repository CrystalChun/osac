package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestConsoleWebSocketAuth_promotesCookieAndClearsOrigin(t *testing.T) {
	t.Parallel()

	var captured *http.Request
	handler := ConsoleWebSocketAuth(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
		copied := *r
		captured = &copied
	}))

	req := httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/api/fulfillment/v1/console_sessions/connect", nil)
	req.AddCookie(&http.Cookie{Name: consoleTicketCookieName, Value: "console-jwt"})
	req.Header.Set("Authorization", "Bearer oidc-access-token")
	req.Header.Set("Origin", "http://localhost:5173")
	req.Header.Set("Referer", "http://localhost:5173/vms/vm-1")

	handler.ServeHTTP(httptest.NewRecorder(), req)

	if captured == nil {
		t.Fatal("expected downstream handler to run")
	}
	if got := captured.Header.Get("Authorization"); got != "Bearer console-jwt" {
		t.Fatalf("Authorization = %q, want Bearer console-jwt", got)
	}
	if captured.Header.Get("Origin") != "" {
		t.Fatalf("Origin = %q, want empty", captured.Header.Get("Origin"))
	}
	if captured.Header.Get("Referer") != "" {
		t.Fatalf("Referer = %q, want empty", captured.Header.Get("Referer"))
	}
}

func TestConsoleWebSocketAuth_leavesAuthorizationEmptyWithoutCookie(t *testing.T) {
	t.Parallel()

	var captured *http.Request
	handler := ConsoleWebSocketAuth(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
		copied := *r
		captured = &copied
	}))

	req := httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/api/fulfillment/v1/console_sessions/connect", nil)
	req.Header.Set("Authorization", "Bearer oidc-access-token")

	handler.ServeHTTP(httptest.NewRecorder(), req)

	if captured == nil {
		t.Fatal("expected downstream handler to run")
	}
	if captured.Header.Get("Authorization") != "" {
		t.Fatalf("Authorization = %q, want empty", captured.Header.Get("Authorization"))
	}
}
