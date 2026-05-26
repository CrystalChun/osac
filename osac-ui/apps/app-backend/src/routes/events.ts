/** Mock event feed — GET /api/events/v1/events */
import type { FastifyInstance } from 'fastify'
import type { FulfillmentProxyRouteConfig } from './fulfillmentProxyConfig.js'
import { proxyToUpstream } from './upstreamProxy.js'

const MOCK_EVENTS = Array.from({ length: 50 }, (_, i) => ({
  id: `event-${i}`,
  type: ['VM_STARTED', 'VM_STOPPED', 'VM_PROVISIONED', 'SNAPSHOT_CREATED'][i % 4],
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  message: `Demo event ${i + 1}`,
  severity: ['info', 'success', 'warning', 'info'][i % 4],
}))

export async function registerEventsRoutes(
  app: FastifyInstance,
  config: FulfillmentProxyRouteConfig,
) {
  const { apiMode, fulfillmentApiUrl, fulfillmentFetch, tempFulfillmentStaticBearer } = config

  if (apiMode === 'dev' && fulfillmentApiUrl) {
    // Same proxy workarounds as fulfillment (see upstreamProxy.ts — OSAC_WORKAROUND_REMOVE).
    app.all('/api/events/v1/*', async (req, reply) => {
      await proxyToUpstream(req, reply, fulfillmentApiUrl, {
        fetchImpl: fulfillmentFetch,
        staticBearer: tempFulfillmentStaticBearer,
      })
    })
    return
  }

  app.get('/api/events/v1/events', async (req) => {
    const query = req.query as { limit?: string; offset?: string }
    const limit = parseInt(query.limit ?? '20', 10)
    const offset = parseInt(query.offset ?? '0', 10)
    const page = MOCK_EVENTS.slice(offset, offset + limit)
    return { size: page.length, total: MOCK_EVENTS.length, items: page }
  })
}
