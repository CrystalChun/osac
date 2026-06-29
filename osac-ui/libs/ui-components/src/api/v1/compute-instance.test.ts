import { describe, expect, it } from 'vitest';

import { ComputeInstanceSchema } from '@osac/types';

import { decodeFulfillmentResponse } from '../fulfillment-decode';

describe('compute instance create response decode', () => {
  it('decodes the unwrapped REST create body as a ComputeInstance', () => {
    const payload = {
      id: '019f0d21-d4c2-7102-9cde-4a909ca1c070',
      metadata: { name: 'web-01' },
      spec: {
        template: 'osac.templates.ocp_virt_vm',
        instance_type: 'standard-4-8',
      },
      status: { state: 'COMPUTE_INSTANCE_STATE_STARTING' },
    };

    const decoded = decodeFulfillmentResponse(ComputeInstanceSchema, payload) as {
      id: string;
      metadata?: { name?: string };
    };

    expect(decoded.id).toBe('019f0d21-d4c2-7102-9cde-4a909ca1c070');
    expect(decoded.metadata?.name).toBe('web-01');
  });
});
