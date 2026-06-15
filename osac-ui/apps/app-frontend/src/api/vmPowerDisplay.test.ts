import { describe, expect, it } from 'vitest';

import { COMPUTE_INSTANCE_STATE } from '@osac/ui-components/vmDisplayState';

import {
  advancePendingPowerWatch,
  createPendingPowerWatch,
  resolveVmDisplayPowerState,
  shouldAdvanceRestartToStarting,
} from './vmPowerDisplay';

describe('vmPowerDisplay', () => {
  it('resolveVmDisplayPowerState overlays pending actions', () => {
    expect(resolveVmDisplayPowerState(COMPUTE_INSTANCE_STATE.STOPPED, 'starting')).toBe('starting');
    expect(resolveVmDisplayPowerState(COMPUTE_INSTANCE_STATE.RUNNING, 'stopping')).toBe('stopping');
    expect(resolveVmDisplayPowerState(COMPUTE_INSTANCE_STATE.STOPPED, 'restarting')).toBe(
      'restarting',
    );
    expect(resolveVmDisplayPowerState(COMPUTE_INSTANCE_STATE.RUNNING, undefined)).toBe(
      COMPUTE_INSTANCE_STATE.RUNNING,
    );
    expect(resolveVmDisplayPowerState('COMPUTE_INSTANCE_STATE_BOGUS', undefined)).toBe(
      COMPUTE_INSTANCE_STATE.UNSPECIFIED,
    );
  });

  it('advancePendingPowerWatch ignores premature running after start', () => {
    let watch = createPendingPowerWatch();

    const r1 = advancePendingPowerWatch('starting', COMPUTE_INSTANCE_STATE.RUNNING, watch);
    expect(r1.clear).toBe(false);
    watch = r1.watch;

    const r2 = advancePendingPowerWatch('starting', COMPUTE_INSTANCE_STATE.STARTING, watch);
    expect(r2.watch.seenApiStarting).toBe(true);

    const r3 = advancePendingPowerWatch('starting', COMPUTE_INSTANCE_STATE.RUNNING, r2.watch);
    expect(r3.clear).toBe(true);
  });

  it('advancePendingPowerWatch clears stop after seen stopping', () => {
    const watch = createPendingPowerWatch();

    const r1 = advancePendingPowerWatch('stopping', COMPUTE_INSTANCE_STATE.STOPPING, watch);
    const r2 = advancePendingPowerWatch('stopping', COMPUTE_INSTANCE_STATE.STOPPED, r1.watch);
    expect(r2.clear).toBe(true);
  });

  it('shouldAdvanceRestartToStarting only on stopped', () => {
    expect(shouldAdvanceRestartToStarting(COMPUTE_INSTANCE_STATE.STOPPED)).toBe(true);
    expect(shouldAdvanceRestartToStarting(COMPUTE_INSTANCE_STATE.RUNNING)).toBe(false);
  });
});
