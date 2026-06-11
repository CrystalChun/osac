package config

import (
	"os"
	"strings"
)

var (
	// BridgeAddr is the TCP address for the server to listen on
	BridgeAddr = getEnvVar("HOST", "0.0.0.0") + ":" + getEnvVar("PORT", "8080")
	// FulfillmentApiUrl where the Fulfillment requests will be proxied to
	FulfillmentApiUrl = getEnvUrlVar("FULFILLMENT_API_URL", "")
	// FulfillmentTlsCaFile CA file for Fulfillment service
	FulfillmentTlsCaFile = getEnvVar("FULFILLMENT_TLS_CA_FILE", "")
	// FulfillmentTlsInsecure disables TLS certificate verification for Fulfillment service
	FulfillmentTlsInsecure = getEnvVar("FULFILLMENT_TLS_INSECURE", "") == "1"
	// OIDCClientID is the client_id registered in the IdP for this UI application.
	OIDCClientID = getEnvVar("OIDC_CLIENT_ID", "osac-ui")
	// OIDCTlsCaFile CA file for the OIDC IdP (discovery, token exchange, refresh).
	OIDCTlsCaFile = getEnvVar("OIDC_TLS_CA_FILE", "")
	// OIDCTlsInsecure disables TLS certificate verification when contacting the OIDC IdP
	// (discovery, token exchange, refresh). For development only.
	OIDCTlsInsecure = getEnvVar("OIDC_TLS_INSECURE", "") == "1"
	// BaseUIURL is the public base URL of the UI used to compute the /callback redirect URI.
	// If empty, the proxy derives it from the SPA's redirect_base query parameter.
	BaseUIURL = getEnvUrlVar("BASE_UI_URL", "")
	// TempStaticBearer dev-only; remove when OIDC always supplies tokens.
	TempStaticBearer = getEnvVar("TEMP_FULFILLMENT_STATIC_BEARER", "")
)

func getEnvUrlVar(key, defaultValue string) string {
	return strings.TrimSuffix(getEnvVar(key, defaultValue), "/")
}

func getEnvVar(key, defaultValue string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return defaultValue
}
