package bridge

import (
	"crypto/tls"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"

	log "github.com/sirupsen/logrus"

	"github.com/osac/proxy/config"
)

type handler struct {
	target *url.URL
	proxy  *httputil.ReverseProxy
}

func (h handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	r.URL.Host = h.target.Host
	r.URL.Scheme = h.target.Scheme
	r.Header.Set("X-Forwarded-Host", r.Header.Get("Host"))
	r.Host = h.target.Host
	// OSAC_WORKAROUND_REMOVE(static-bearer): dev fallback; middleware.Auth already injects Bearer
	// from the OIDC session cookie. This only fires when OIDC is not yet wired.
	applyStaticBearer(r)
	h.proxy.ServeHTTP(w, r)
}

func createReverseProxy(apiURL string) (*url.URL, *httputil.ReverseProxy) {
	target, err := url.Parse(apiURL)
	if err != nil {
		log.WithError(err).Errorf("Failed to parse URL '%s'", apiURL)
		os.Exit(1)
	}
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ModifyResponse = func(r *http.Response) error {
		for _, h := range []string{
			"Access-Control-Allow-Headers",
			"Access-Control-Allow-Methods",
			"Access-Control-Allow-Origin",
			"Access-Control-Expose-Headers",
		} {
			r.Header.Del(h)
		}
		return nil
	}
	return target, proxy
}

// NewFulfillmentHandler creates new handler for Fulfillment service
func NewFulfillmentHandler(tlsConfig *tls.Config) handler {
	target, proxy := createReverseProxy(config.FulfillmentApiUrl)
	proxy.Transport = &http.Transport{
		TLSClientConfig: tlsConfig,
	}
	return handler{target: target, proxy: proxy}
}

// applyStaticBearer injects or replaces the Authorization header when a static bearer is configured.
// OSAC_WORKAROUND_REMOVE(static-bearer): inject TEMP_FULFILLMENT_STATIC_BEARER for dev until
// server-side / OIDC supplies tokens on every call.
func applyStaticBearer(r *http.Request) {
	token := config.TempStaticBearer
	if token != "" {
		r.Header.Set("Authorization", "Bearer "+token)
	}
}
