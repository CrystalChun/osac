import { describe, expect, it } from 'vitest';
import type { ComputeInstance } from '@osac/api-contracts';
import { pinProvisioningVmsToListEnd } from './vmListDisplayOrder';

const vm = (id: string): ComputeInstance => {
  return { id, metadata: { name: id }, spec: {}, status: { state: 'running' } };
};

describe('pinProvisioningVmsToListEnd', () => {
  it('moves placeholder and post-create VMs to the end', () => {
    const ordered = pinProvisioningVmsToListEnd(
      [vm('pending-vm-1'), vm('a'), vm('b'), vm('new-1')],
      ['new-1'],
    );
    expect(ordered.map((v) => v.id)).toEqual(['a', 'b', 'pending-vm-1', 'new-1']);
  });
});
