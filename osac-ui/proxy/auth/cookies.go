package auth

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
)

const (
	// Three separate cookies so no single cookie exceeds the 4096-byte browser limit.
	accessTokenCookieName  = "osac-access"
	refreshTokenCookieName = "osac-refresh"
	idTokenCookieName      = "osac-id"

	authCookiePrefix = "osac-auth-"
	authCookieMaxAge = 10 * 60 // 10 minutes
)

// TokenData holds the tokens for a user session.
type TokenData struct {
	AccessToken  string
	RefreshToken string
	IDToken      string
}

// authFlowCookie holds everything the callback handler needs, keyed by state (CSRF).
// Stored in a short-lived HttpOnly cookie because it is small (~200 bytes).
type authFlowCookie struct {
	Verifier    string `json:"verifier"`
	RedirectURI string `json:"redirectURI"`
	IssuerURL   string `json:"issuerURL"`
}

func isSecure(r *http.Request) bool {
	return r.TLS != nil
}

// SetSessionCookies writes three separate HttpOnly cookies:
//   - osac-access  — access token;  MaxAge = expiresIn
//   - osac-refresh — refresh token; MaxAge = expiresIn * 12 (survives several access-token cycles)
//   - osac-id      — ID token;      MaxAge = expiresIn  (used only for /login/info)
//
// Splitting avoids the 4096-byte per-cookie limit and keeps sessions alive across proxy restarts.
func SetSessionCookies(w http.ResponseWriter, r *http.Request, data TokenData, expiresIn int) {
	secure := isSecure(r)
	setTokenCookie(w, accessTokenCookieName, data.AccessToken, expiresIn, secure)
	if data.RefreshToken != "" {
		refreshMaxAge := expiresIn * 12
		if refreshMaxAge < 3600 {
			refreshMaxAge = 3600 // at least 1 hour
		}
		setTokenCookie(w, refreshTokenCookieName, data.RefreshToken, refreshMaxAge, secure)
	}
	if data.IDToken != "" {
		setTokenCookie(w, idTokenCookieName, data.IDToken, expiresIn, secure)
	}
}

// LookupSessionCookies reads the three token cookies. Returns nil if the access token is absent.
func LookupSessionCookies(r *http.Request) *TokenData {
	access, err := r.Cookie(accessTokenCookieName)
	if err != nil || access.Value == "" {
		return nil
	}
	data := &TokenData{AccessToken: access.Value}
	if c, err := r.Cookie(refreshTokenCookieName); err == nil {
		data.RefreshToken = c.Value
	}
	if c, err := r.Cookie(idTokenCookieName); err == nil {
		data.IDToken = c.Value
	}
	return data
}

// ClearSessionCookies expires all three token cookies and the session cookie (if present).
func ClearSessionCookies(w http.ResponseWriter, r *http.Request) {
	secure := isSecure(r)
	for _, name := range []string{accessTokenCookieName, refreshTokenCookieName, idTokenCookieName} {
		http.SetCookie(w, &http.Cookie{Name: name, Value: "", Path: "/", HttpOnly: true, MaxAge: -1, Secure: secure, SameSite: http.SameSiteStrictMode})
	}
}

func setTokenCookie(w http.ResponseWriter, name, value string, maxAge int, secure bool) {
	if value == "" {
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		Secure:   secure,
		MaxAge:   maxAge,
	})
}

// setAuthFlowCookie stores the PKCE verifier + redirect URI + issuer in a short-lived HttpOnly
// cookie keyed by the OAuth state value.
func setAuthFlowCookie(w http.ResponseWriter, r *http.Request, state string, flow authFlowCookie) error {
	b, err := json.Marshal(flow)
	if err != nil {
		return err
	}
	http.SetCookie(w, &http.Cookie{
		Name:     authCookiePrefix + state,
		Value:    base64.StdEncoding.EncodeToString(b),
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   isSecure(r),
		MaxAge:   authCookieMaxAge,
	})
	return nil
}

// getAndClearAuthFlowCookie reads (and immediately clears) the auth-flow cookie for a given state.
func getAndClearAuthFlowCookie(w http.ResponseWriter, r *http.Request, state string) (*authFlowCookie, error) {
	name := authCookiePrefix + state
	cookie, err := r.Cookie(name)
	if err != nil {
		return nil, fmt.Errorf("auth flow cookie not found for state: %w", err)
	}
	// Clear immediately to prevent replay.
	http.SetCookie(w, &http.Cookie{Name: name, Value: "", Path: "/", HttpOnly: true, MaxAge: -1})

	b, err := base64.StdEncoding.DecodeString(cookie.Value)
	if err != nil {
		return nil, fmt.Errorf("decode auth flow cookie: %w", err)
	}
	var flow authFlowCookie
	if err := json.Unmarshal(b, &flow); err != nil {
		return nil, fmt.Errorf("unmarshal auth flow cookie: %w", err)
	}
	return &flow, nil
}
