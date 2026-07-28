package bridge

import (
	"crypto/tls"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestNewGRPCTransport_doesNotMutateSharedTLSConfig guards against OSAC-3081: main.go
// passes one *tls.Config to multiple independent transports (this one, the plain
// FulfillmentHTTPClient transport, and NewConsoleWebSocketProxy's transport).
// ForceAttemptHTTP2 makes net/http mutate TLSClientConfig.NextProtos in place on first
// use — if newGRPCTransport didn't clone, that mutation would leak into the other
// transports sharing the same pointer, making them offer ALPN "h2" while still
// speaking HTTP/1.1 and get their connections reset by an ALPN-aware upstream.
func TestNewGRPCTransport_doesNotMutateSharedTLSConfig(t *testing.T) {
	t.Parallel()

	shared := &tls.Config{MinVersion: tls.VersionTLS13}
	transport := newGRPCTransport(shared)

	httpTransport, ok := transport.(*http.Transport)
	if !ok {
		t.Fatalf("expected *http.Transport, got %T", transport)
	}
	if httpTransport.TLSClientConfig == shared {
		t.Fatal("expected newGRPCTransport to clone tlsConfig, not share the pointer")
	}

	// net/http lazily runs its ForceAttemptHTTP2 configuration (which mutates
	// TLSClientConfig.NextProtos) on the transport's first RoundTrip call, regardless
	// of whether the dial itself succeeds — so a request to an address nothing listens
	// on is enough to trigger the side effect under test.
	req := httptest.NewRequestWithContext(t.Context(), http.MethodGet, "https://127.0.0.1:0/", nil)
	resp, err := httpTransport.RoundTrip(req) //nolint:bodyclose // RoundTrip is expected to fail before returning a body
	if err == nil {
		t.Fatal("expected RoundTrip to fail dialing a port nothing listens on")
	}
	if resp != nil {
		t.Fatal("expected no response on dial failure")
	}

	if shared.NextProtos != nil {
		t.Fatalf("expected the original shared *tls.Config to be untouched, got NextProtos=%v", shared.NextProtos)
	}
}
