import { describe, expect, it } from 'vitest'
import { assertFulfillmentDevReady } from './startupConfig.js'

describe('assertFulfillmentDevReady', () => {
  it('allows mock mode with empty URL', () => {
    expect(() => assertFulfillmentDevReady('mock', undefined)).not.toThrow()
  })

  it('throws when dev mode has no URL', () => {
    expect(() => assertFulfillmentDevReady('dev', undefined)).toThrow(/FULFILLMENT_API_URL/)
    expect(() => assertFulfillmentDevReady('dev', '   ')).toThrow(/FULFILLMENT_API_URL/)
  })

  it('throws on invalid URL in dev mode', () => {
    expect(() => assertFulfillmentDevReady('dev', 'not a url')).toThrow(/valid URL/)
  })

  it('throws on non-http(s) URL in dev mode', () => {
    expect(() => assertFulfillmentDevReady('dev', 'ftp://x')).toThrow(/http:/)
  })

  it('accepts https URL in dev mode', () => {
    expect(() => assertFulfillmentDevReady('dev', 'https://fulfillment.test/api')).not.toThrow()
  })
})
