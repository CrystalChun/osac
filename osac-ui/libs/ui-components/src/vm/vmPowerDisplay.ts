/**
 * Pending power-action badges until GET compute_instances reports a terminal state.
 * See docs/specs/ui-flows/manage-virtual-machines.yaml (pending power display).
 */
import {
  COMPUTE_INSTANCE_STATE,
  type DisplayVmState,
  isKnownWireComputeInstanceState,
} from '../vmDisplayState';

export type VmPendingPowerAction = 'starting' | 'stopping' | 'restarting';

export interface PendingPowerWatch {
  seenApiStarting: boolean;
  seenApiStopping: boolean;
  consecutiveRunning: number;
  consecutiveStopped: number;
}

export const createPendingPowerWatch = (): PendingPowerWatch => {
  return {
    seenApiStarting: false,
    seenApiStopping: false,
    consecutiveRunning: 0,
    consecutiveStopped: 0,
  };
};

/** @deprecated Use advancePendingPowerWatch; kept for restart-only checks in tests. */
export const shouldClearPendingPowerAction = (
  action: VmPendingPowerAction,
  apiState: string,
): boolean => {
  return advancePendingPowerWatch(action, apiState, createPendingPowerWatch()).clear;
};

/** Restart phase 1 complete — server reports stopped; switch badge to Starting and PATCH start. */
export const shouldAdvanceRestartToStarting = (apiState: string): boolean => {
  return apiState === COMPUTE_INSTANCE_STATE.STOPPED;
};

/**
 * Reconcile pending start/stop against list API state. Ignores premature terminal states
 * (e.g. running right after PATCH start) until the expected transition is observed.
 */
export const advancePendingPowerWatch = (
  action: VmPendingPowerAction,
  apiState: string,
  watch: PendingPowerWatch,
): { watch: PendingPowerWatch; clear: boolean } => {
  if (action === 'restarting') {
    return { watch, clear: apiState === COMPUTE_INSTANCE_STATE.FAILED };
  }

  if (apiState === COMPUTE_INSTANCE_STATE.FAILED) {
    return { watch, clear: true };
  }

  if (action === 'starting') {
    if (
      apiState === COMPUTE_INSTANCE_STATE.STARTING ||
      apiState === COMPUTE_INSTANCE_STATE.STOPPING
    ) {
      return {
        watch: { ...watch, seenApiStarting: true, consecutiveRunning: 0 },
        clear: false,
      };
    }
    if (apiState === COMPUTE_INSTANCE_STATE.RUNNING) {
      if (watch.seenApiStarting) {
        return { watch, clear: true };
      }
      const consecutiveRunning = watch.consecutiveRunning + 1;
      if (consecutiveRunning >= 2) {
        return { watch: { ...watch, consecutiveRunning }, clear: true };
      }
      return { watch: { ...watch, consecutiveRunning }, clear: false };
    }
    return { watch: { ...watch, consecutiveRunning: 0 }, clear: false };
  }

  if (action === 'stopping') {
    if (apiState === COMPUTE_INSTANCE_STATE.STOPPING) {
      return {
        watch: { ...watch, seenApiStopping: true, consecutiveStopped: 0 },
        clear: false,
      };
    }
    if (apiState === COMPUTE_INSTANCE_STATE.STOPPED) {
      if (watch.seenApiStopping) {
        return { watch, clear: true };
      }
      const consecutiveStopped = watch.consecutiveStopped + 1;
      if (consecutiveStopped >= 2) {
        return { watch: { ...watch, consecutiveStopped }, clear: true };
      }
      return { watch: { ...watch, consecutiveStopped }, clear: false };
    }
    return { watch: { ...watch, consecutiveStopped: 0 }, clear: false };
  }

  return { watch, clear: false };
};

export const resolveVmDisplayPowerState = (
  apiState: string,
  pending: VmPendingPowerAction | undefined,
): DisplayVmState => {
  if (pending === 'starting') {
    return 'starting';
  }
  if (pending === 'stopping') {
    return 'stopping';
  }
  if (pending === 'restarting') {
    return 'restarting';
  }
  return isKnownWireComputeInstanceState(apiState) ? apiState : COMPUTE_INSTANCE_STATE.UNSPECIFIED;
};
