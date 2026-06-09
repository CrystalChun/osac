import { describe, expect, it } from 'vitest';
import { isVmTransitionPowerState } from '@osac/api-contracts';

describe('isVmTransitionPowerState', () => {
  it('returns true for in-action states', () => {
    expect(isVmTransitionPowerState('starting')).toBe(true);
    expect(isVmTransitionPowerState('stopping')).toBe(true);
    expect(isVmTransitionPowerState('restarting')).toBe(true);
    expect(isVmTransitionPowerState('deleting')).toBe(true);
    expect(isVmTransitionPowerState('creating')).toBe(true);
    expect(isVmTransitionPowerState('still_provisioning')).toBe(true);
  });

  it('returns false for stable states', () => {
    expect(isVmTransitionPowerState('running')).toBe(false);
    expect(isVmTransitionPowerState('stopped')).toBe(false);
    expect(isVmTransitionPowerState('paused')).toBe(false);
    expect(isVmTransitionPowerState('error')).toBe(false);
  });
});
