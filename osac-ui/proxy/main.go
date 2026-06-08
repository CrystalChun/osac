package main

import (
	"crypto/tls"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/andybalholm/brotli"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/osac/proxy/auth"
	"github.com/osac/proxy/bridge"
	"github.com/osac/proxy/config"
	proxylog "github.com/osac/proxy/log"
	proxymiddleware "github.com/osac/proxy/middleware"
	"github.com/osac/proxy/server"
)

func main() {
	log := proxylog.InitLogs()

	if config.FulfillmentApiUrl == "" {
		log.Fatal("FULFILLMENT_API_URL is required")
	}
	if config.OIDCClientID == "" {
		log.Warn("OIDC_CLIENT_ID is not set — OIDC login endpoints will be unavailable")
	}

	tlsConfig, err := bridge.GetTlsConfig()
	if err != nil {
		log.WithError(err).Fatal("Failed to get TLS configuration")
	}

	fulfillmentHandler := bridge.NewFulfillmentHandler(tlsConfig)

	oidcTLSConfig, err := bridge.GetOIDCTlsConfig()
	if err != nil {
		log.WithError(err).Fatal("Failed to get OIDC TLS configuration")
	}

	authHandler := &auth.Handler{
		ClientID:              config.OIDCClientID,
		BaseUIURL:             config.BaseUIURL,
		FulfillmentAPIURL:     config.FulfillmentApiUrl,
		FulfillmentHTTPClient: newHTTPClient(tlsConfig),
		OIDCHTTPClient:        newHTTPClient(oidcTLSConfig),
	}

	compressor := middleware.NewCompressor(5)
	compressor.SetEncoder("br", func(w io.Writer, level int) io.Writer {
		return brotli.NewWriterLevel(w, level)
	})

	router := chi.NewRouter()
	router.Use(middleware.RequestID)
	router.Use(middleware.Recoverer)
	router.Use(middleware.Logger)
	router.Use(compressor.Handler)

	router.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(map[string]string{"status": "ok"}); err != nil {
			log.WithError(err).Warn("failed to write /health response")
			return
		}
	})
	router.Get("/ready", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(map[string]string{"status": "ready"}); err != nil {
			log.WithError(err).Warn("failed to write /ready response")
			return
		}
	})

	// Auth endpoints — only available when OIDC_CLIENT_ID is configured.
	if config.OIDCClientID != "" {
		router.Get("/api/login", authHandler.GetLogin)
		router.Post("/api/login", authHandler.PostLogin)
		router.Get("/api/login/info", authHandler.GetLoginInfo)
		router.Get("/api/login/refresh", authHandler.GetLoginRefresh)
		router.Post("/api/logout", authHandler.PostLogout)
	}

	// API routes — authenticated via session cookie (middleware injects Bearer header upstream).
	router.Group(func(r chi.Router) {
		r.Use(proxymiddleware.Auth)
		for _, prefix := range []string{
			"/api/fulfillment/v1",
			"/api/events/v1",
			"/api/osac/public/v1",
		} {
			r.Handle(prefix, fulfillmentHandler)
			r.Handle(prefix+"/*", fulfillmentHandler)
		}
	})

	log.Info("Serving SPA static files from /app/public")
	spa := server.SpaHandler{Dir: "/app/public"}
	router.NotFound(spa.ServeHTTP)

	srv := &http.Server{
		Handler:      router,
		Addr:         config.BridgeAddr,
		WriteTimeout: 15 * time.Minute,
		ReadTimeout:  15 * time.Second,
	}

	log.Infof("osac-proxy running at %s (upstream: %s)", config.BridgeAddr, config.FulfillmentApiUrl)
	log.Fatal(srv.ListenAndServe())
}

func newHTTPClient(tlsConfig *tls.Config) *http.Client {
	return &http.Client{
		Transport: &http.Transport{TLSClientConfig: tlsConfig},
		Timeout:   15 * time.Second,
	}
}
