import { describe, expect, it } from 'vitest'
import { createFulfillmentUpstream } from './fulfillmentUpstream.js'

describe('createFulfillmentUpstream', () => {
  it('refuses insecure TLS in production', () => {
    expect(() =>
      createFulfillmentUpstream({
        tlsInsecure: true,
        nodeEnv: 'production',
      }),
    ).toThrow(/TEMP_FULFILLMENT_TLS_INSECURE/)
  })

  it('allows default (no custom TLS) without throwing', () => {
    expect(() => createFulfillmentUpstream({ tlsInsecure: false })).not.toThrow()
  })
})
