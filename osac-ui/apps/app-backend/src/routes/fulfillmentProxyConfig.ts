import type { UpstreamFetch } from './upstreamProxy.js'

/** Shared config for BFF routes that proxy to FULFILLMENT_API_URL in dev mode. */
export interface FulfillmentProxyRouteConfig {
  apiMode: string
  fulfillmentApiUrl?: string
  fulfillmentFetch: UpstreamFetch
  /** OSAC_WORKAROUND_REMOVE(static-bearer): TEMP_FULFILLMENT_STATIC_BEARER plumbing. */
  tempFulfillmentStaticBearer?: string
}
