package auth

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"
)

func TestHandler_IssuerURLCachesResult(t *testing.T) {
	var calls atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls.Add(1)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(capabilitiesResponse{
			Authn: struct {
				TrustedTokenIssuers []string `json:"trusted_token_issuers"`
			}{
				TrustedTokenIssuers: []string{"https://keycloak.example.com/realms/osac"},
			},
		})
	}))
	defer srv.Close()

	h := &Handler{
		FulfillmentAPIURL:     srv.URL,
		FulfillmentHTTPClient: srv.Client(),
	}

	issuer1, err := h.issuerURL()
	if err != nil {
		t.Fatalf("first call: %v", err)
	}
	issuer2, err := h.issuerURL()
	if err != nil {
		t.Fatalf("second call: %v", err)
	}

	if issuer1 != issuer2 {
		t.Fatalf("issuer mismatch: %q vs %q", issuer1, issuer2)
	}
	if got := calls.Load(); got != 1 {
		t.Fatalf("expected 1 upstream call (cached), got %d", got)
	}
}

func TestHandler_IssuerURLRefetchesAfterExpiry(t *testing.T) {
	var calls atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls.Add(1)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(capabilitiesResponse{
			Authn: struct {
				TrustedTokenIssuers []string `json:"trusted_token_issuers"`
			}{
				TrustedTokenIssuers: []string{"https://keycloak.example.com/realms/osac"},
			},
		})
	}))
	defer srv.Close()

	h := &Handler{
		FulfillmentAPIURL:     srv.URL,
		FulfillmentHTTPClient: srv.Client(),
	}

	_, err := h.issuerURL()
	if err != nil {
		t.Fatalf("first call: %v", err)
	}

	// Force cache expiry.
	h.issuerMu.Lock()
	h.issuerExpires = time.Now().Add(-1 * time.Second)
	h.issuerMu.Unlock()

	_, err = h.issuerURL()
	if err != nil {
		t.Fatalf("second call after expiry: %v", err)
	}

	if got := calls.Load(); got != 2 {
		t.Fatalf("expected 2 upstream calls (cache expired), got %d", got)
	}
}
