package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"
)

type capabilitiesResponse struct {
	Authn struct {
		TrustedTokenIssuers []string `json:"trusted_token_issuers"`
	} `json:"authn"`
}

// FetchIssuerURL fetches the fulfillment capabilities and returns the first trusted OIDC issuer URL.
func FetchIssuerURL(fulfillmentAPIURL string, httpClient *http.Client) (string, error) {
	if httpClient == nil {
		httpClient = http.DefaultClient
	}

	capabilitiesURL := strings.TrimSuffix(fulfillmentAPIURL, "/") + "/api/fulfillment/v1/capabilities"
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, capabilitiesURL, nil)
	if err != nil {
		return "", fmt.Errorf("build capabilities request: %w", err)
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("fetch capabilities: %w", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.WithError(err).Warn("failed to close response body")
		}
	}()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("capabilities endpoint returned HTTP %d", resp.StatusCode)
	}
	var caps capabilitiesResponse
	if err := json.NewDecoder(resp.Body).Decode(&caps); err != nil {
		return "", fmt.Errorf("decode capabilities: %w", err)
	}
	if len(caps.Authn.TrustedTokenIssuers) == 0 {
		return "", fmt.Errorf("no trusted token issuers in capabilities response")
	}
	return caps.Authn.TrustedTokenIssuers[0], nil
}
