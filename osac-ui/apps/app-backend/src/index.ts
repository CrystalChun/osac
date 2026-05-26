import type { LogLevel } from 'fastify'
import { buildApp } from './app.js'
import { assertFulfillmentDevReady } from './startupConfig.js'

const PORT = parseInt(process.env.PORT ?? '3001', 10)
const HOST = process.env.HOST ?? '0.0.0.0'
const LOG_LEVEL = (process.env.LOG_LEVEL ?? 'info') as LogLevel
const API_MODE = process.env.OSAC_API_MODE ?? 'mock'
const FULFILLMENT_API_URL = process.env.FULFILLMENT_API_URL?.trim()

try {
  assertFulfillmentDevReady(API_MODE, FULFILLMENT_API_URL)
} catch (err) {
  const message = err instanceof Error ? err.message : String(err)
  console.error(message)
  process.exit(1)
}

// OSAC_WORKAROUND_REMOVE(tls-insecure): dev-only; remove when upstream uses a public CA or FULFILLMENT_TLS_CA_FILE in all envs that need it.
if (
  process.env.TEMP_FULFILLMENT_TLS_INSECURE === '1' &&
  process.env.NODE_ENV !== 'production' &&
  !process.env.FULFILLMENT_TLS_CA_FILE?.trim()
) {
  console.warn(
    '[osac-bff] TEMP_FULFILLMENT_TLS_INSECURE: TLS verification disabled for fulfillment upstream (dev only).',
  )
}

const app = await buildApp({
  apiMode: API_MODE,
  fulfillmentApiUrl: FULFILLMENT_API_URL,
  enableSpaStatic: true,
  nodeEnv: process.env.NODE_ENV,
  logger: { level: LOG_LEVEL },
  // OSAC_WORKAROUND_REMOVE(static-bearer): delete when OIDC / BFF token exchange always sets Authorization from the browser.
  tempFulfillmentStaticBearer: process.env.TEMP_FULFILLMENT_STATIC_BEARER?.trim(),
})

try {
  await app.listen({ port: PORT, host: HOST })
  app.log.info(`OSAC BFF running at http://${HOST}:${PORT} [mode=${API_MODE}]`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
