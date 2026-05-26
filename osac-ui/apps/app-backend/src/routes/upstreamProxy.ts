import type { FastifyReply, FastifyRequest } from 'fastify'

/**
 * OSAC_WORKAROUND_REMOVE(static-bearer-capabilities):
 * OIDC hints are readable without Bearer on many gateways; sending a dev SA JWT here
 * can make Envoy return 200 with an empty body (token not meant for this route).
 * Remove when the gateway accepts the same access token on GET /capabilities as on other routes,
 * or when the SPA always sends the user token for this call and static bearer is gone.
 */
function shouldSkipStaticBearerForRequest(req: FastifyRequest): boolean {
  const method = req.method.toUpperCase()
  const path = (req.url.split('?')[0] ?? '').split('#')[0]
  return method === 'GET' && path === '/api/fulfillment/v1/capabilities'
}

export type UpstreamFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-length',
  'host',
])

function appendRequestHeaders(req: FastifyRequest): Headers {
  const headers = new Headers()
  for (const [name, rawValue] of Object.entries(req.headers)) {
    if (rawValue == null) continue
    const normalized = name.toLowerCase()
    if (normalized === 'host' || normalized === 'content-length') continue
    if (HOP_BY_HOP_HEADERS.has(normalized)) continue
    if (Array.isArray(rawValue)) {
      for (const value of rawValue) headers.append(name, value)
      continue
    }
    headers.set(name, rawValue)
  }
  return headers
}

/**
 * OSAC_WORKAROUND_REMOVE(static-bearer-empty-header):
 * Treats `Authorization: Bearer` / `Bearer ` as absent so TEMP_FULFILLMENT_STATIC_BEARER can apply.
 * Revisit when the SPA never sends a malformed Authorization header (full OIDC/session flow).
 */
function hasNonEmptyBearer(headers: Headers): boolean {
  const raw = headers.get('authorization')?.trim()
  if (!raw) return false
  const m = /^Bearer\s+(\S+)/i.exec(raw)
  return Boolean(m?.[1]?.trim())
}

/**
 * OSAC_WORKAROUND_REMOVE(static-bearer):
 * Injects TEMP_FULFILLMENT_STATIC_BEARER for dev until server-side / OIDC supplies tokens on every call.
 */
function applyStaticBearerIfNeeded(
  req: FastifyRequest,
  headers: Headers,
  staticBearer?: string,
): void {
  const token = staticBearer?.trim()
  if (!token) return
  if (shouldSkipStaticBearerForRequest(req)) return

  // OSAC_WORKAROUND_REMOVE(static-bearer-force): TEMP_FULFILLMENT_STATIC_BEARER_FORCE; dev-only when sessionStorage has an expired JWT
  // so merge-only static bearer never runs (hasNonEmptyBearer stays true). Never in production.
  const forceStatic =
    process.env.TEMP_FULFILLMENT_STATIC_BEARER_FORCE === '1' &&
    process.env.NODE_ENV !== 'production'
  if (forceStatic) {
    headers.set('Authorization', `Bearer ${token}`)
    return
  }

  if (hasNonEmptyBearer(headers)) return
  headers.set('Authorization', `Bearer ${token}`)
}

/** Only methods that should carry a JSON body from this BFF. */
function upstreamJsonBody(method: string, rawBody: unknown): string | undefined {
  const m = method.toUpperCase()
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(m)) return undefined
  if (rawBody == null) return undefined
  return JSON.stringify(rawBody)
}

function copyResponseHeaders(reply: FastifyReply, upstream: Response): void {
  upstream.headers.forEach((value, name) => {
    if (HOP_BY_HOP_HEADERS.has(name.toLowerCase())) return
    reply.header(name, value)
  })
}

/** After buffering the body, these must not be forwarded (length/encoding no longer match). */
function stripHopByHopFromReply(reply: FastifyReply): void {
  for (const name of ['content-length', 'transfer-encoding', 'content-encoding']) {
    reply.removeHeader(name)
  }
}

export interface ProxyToUpstreamOptions {
  fetchImpl?: UpstreamFetch
  /** OSAC_WORKAROUND_REMOVE(static-bearer): TEMP_FULFILLMENT_STATIC_BEARER path; delete field when unused. */
  staticBearer?: string
}

export async function proxyToUpstream(
  req: FastifyRequest,
  reply: FastifyReply,
  upstreamBaseUrl: string,
  options?: ProxyToUpstreamOptions,
): Promise<void> {
  const upstreamUrl = new URL(req.url, upstreamBaseUrl).toString()
  const method = req.method.toUpperCase()
  const body = upstreamJsonBody(method, req.body)

  const headers = appendRequestHeaders(req)
  applyStaticBearerIfNeeded(req, headers, options?.staticBearer)
  const fetchFn = options?.fetchImpl ?? (globalThis.fetch as UpstreamFetch)

  const fetchInit: RequestInit = { method, headers }
  if (body !== undefined) fetchInit.body = body

  const upstream = await fetchFn(upstreamUrl, fetchInit)

  // OSAC_WORKAROUND_REMOVE(proxy-buffer-body):
  // Buffer instead of piping Readable.fromWeb(upstream.body): Undici + Fastify streaming
  // can yield an empty client body while upstream headers still show application/json.
  // Revisit streaming passthrough once the stack is verified (or gateway streaming needs it).
  const payload =
    upstream.body == null ? Buffer.alloc(0) : Buffer.from(await upstream.arrayBuffer())

  copyResponseHeaders(reply, upstream)
  stripHopByHopFromReply(reply)
  reply.status(upstream.status)
  reply.send(payload.length === 0 ? null : payload)
}
