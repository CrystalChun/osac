import { describe, expect, it } from 'vitest';

import { ComputeInstanceSchema } from '@osac/types';

import { decodeFulfillmentResponse } from './fulfillment-decode';

describe('decodeFulfillmentResponse', () => {
  it('decodes ComputeInstance template_parameters with google.protobuf.StringValue wrappers', () => {
    const payload = {
      id: '019ef96a-0b25-7eb0-a23e-c0ec5afbda2a',
      metadata: { name: 'smoke-test-vm' },
      spec: {
        template: 'osac.templates.ocp_virt_vm',
        template_parameters: {
          user_data: {
            '@type': 'type.googleapis.com/google.protobuf.StringValue',
            value: '#cloud-config\nusers: []',
          },
        },
        cores: 5,
        memory_gib: 5,
      },
    };

    const decoded = decodeFulfillmentResponse(ComputeInstanceSchema, payload);

    expect(decoded).toMatchObject({
      id: '019ef96a-0b25-7eb0-a23e-c0ec5afbda2a',
      spec: {
        template: 'osac.templates.ocp_virt_vm',
        cores: 5,
        memoryGib: 5,
        templateParameters: {
          user_data: expect.objectContaining({
            typeUrl: 'type.googleapis.com/google.protobuf.StringValue',
          }),
        },
      },
    });
  });

  it('passes through data when no schema is provided', () => {
    const payload = { id: 'abc' };
    expect(decodeFulfillmentResponse(undefined, payload)).toBe(payload);
  });

  it('ignores unknown JSON keys on nested messages (e.g. mock status.message)', () => {
    const payload = {
      id: 'vm-1',
      metadata: { name: 'web-01' },
      spec: { template: 'osac.templates.ocp_virt_vm' },
      status: {
        state: 'COMPUTE_INSTANCE_STATE_RUNNING',
        message: 'belongs on conditions, not status — should be ignored',
      },
    };

    const decoded = decodeFulfillmentResponse(ComputeInstanceSchema, payload) as {
      status?: { state: number };
    };

    expect(decoded.status?.state).toBe(2); // COMPUTE_INSTANCE_STATE_RUNNING
  });
});
