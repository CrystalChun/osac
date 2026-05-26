/** Mock console access — GET /api/osac/public/v1/console/:resourceType/:resourceId/access */
import type { FastifyInstance } from 'fastify'
import type { FulfillmentProxyRouteConfig } from './fulfillmentProxyConfig.js'
import { proxyToUpstream } from './upstreamProxy.js'

export async function registerConsoleRoutes(
  app: FastifyInstance,
  config: FulfillmentProxyRouteConfig,
) {
  const { apiMode, fulfillmentApiUrl, fulfillmentFetch, tempFulfillmentStaticBearer } = config

  if (apiMode === 'dev' && fulfillmentApiUrl) {
    // Same proxy workarounds as fulfillment (see upstreamProxy.ts — OSAC_WORKAROUND_REMOVE).
    app.all('/api/osac/public/v1/*', async (req, reply) => {
      await proxyToUpstream(req, reply, fulfillmentApiUrl, {
        fetchImpl: fulfillmentFetch,
        staticBearer: tempFulfillmentStaticBearer,
      })
    })
    return
  }

  app.get('/api/osac/public/v1/console/:resourceType/:resourceId/access', async (req) => {
    const { resourceType } = req.params as { resourceType: string; resourceId: string }
    const available =
      resourceType === 'CONSOLE_RESOURCE_TYPE_COMPUTE_INSTANCE' ||
      resourceType === 'COMPUTE_INSTANCE_RESOURCE_TYPE_COMPUTE_INSTANCE'
    return {
      available,
      reason: available ? undefined : 'Resource type not supported for console access',
      supportedTypes: available ? ['serial', 'vnc'] : [],
    }
  })
}
