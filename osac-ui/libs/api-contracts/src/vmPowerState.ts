import type { VmPowerState } from './types.js';

/** States where the VM is mid-transition; UI shows a spinner beside the status badge. */
export const VM_TRANSITION_POWER_STATES: readonly VmPowerState[] = [
  'starting',
  'stopping',
  'restarting',
  'deleting',
  'creating',
  'still_provisioning',
];

const TRANSITION_SET = new Set<VmPowerState>(VM_TRANSITION_POWER_STATES);

export const isVmTransitionPowerState = (state: VmPowerState): boolean => {
  return TRANSITION_SET.has(state);
};
