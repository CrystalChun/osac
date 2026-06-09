/**
 * Session-scoped pending power-action state (survives route changes within the SPA).
 */
import {
  type PendingPowerWatch,
  type VmPendingPowerAction,
  createPendingPowerWatch,
} from './vmPowerDisplay';

export interface VmPowerPendingEntry {
  action: VmPendingPowerAction;
  watch: PendingPowerWatch;
  inRestartCycle: boolean;
  restartStartSent: boolean;
}

const pendingByVmId = new Map<string, VmPowerPendingEntry>();
const listeners = new Set<() => void>();

const notify = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

export const subscribePowerPending = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getPendingPowerAction = (vmId: string): VmPendingPowerAction | undefined => {
  return pendingByVmId.get(vmId)?.action;
};

export const getPowerWatch = (vmId: string): PendingPowerWatch | undefined => {
  return pendingByVmId.get(vmId)?.watch;
};

export const setPowerWatch = (vmId: string, watch: PendingPowerWatch): void => {
  const entry = pendingByVmId.get(vmId);
  if (!entry) {
    return;
  }
  pendingByVmId.set(vmId, { ...entry, watch });
  notify();
};

export const isInRestartCycle = (vmId: string): boolean => {
  return pendingByVmId.get(vmId)?.inRestartCycle ?? false;
};

export const isRestartStartSent = (vmId: string): boolean => {
  return pendingByVmId.get(vmId)?.restartStartSent ?? false;
};

export const markRestartStartSent = (vmId: string): void => {
  const entry = pendingByVmId.get(vmId);
  if (!entry) {
    return;
  }
  pendingByVmId.set(vmId, { ...entry, restartStartSent: true });
  notify();
};

export const setPowerPending = (
  vmId: string,
  action: VmPendingPowerAction,
  opts?: { restartCycle?: boolean },
): void => {
  pendingByVmId.set(vmId, {
    action,
    watch: createPendingPowerWatch(),
    inRestartCycle: opts?.restartCycle ?? action === 'restarting',
    restartStartSent: false,
  });
  notify();
};

export const updatePowerPendingAction = (vmId: string, action: VmPendingPowerAction): void => {
  const entry = pendingByVmId.get(vmId);
  if (!entry) {
    return;
  }
  pendingByVmId.set(vmId, { ...entry, action });
  notify();
};

export const clearPowerPending = (vmId: string): void => {
  if (pendingByVmId.delete(vmId)) {
    notify();
  }
};

export const listPendingPowerVmIds = (): string[] => {
  return [...pendingByVmId.keys()];
};

export const hasAnyPowerPending = (): boolean => {
  return pendingByVmId.size > 0;
};

/** @internal test helper */
export const clearAllPowerPending = (): void => {
  if (pendingByVmId.size > 0) {
    pendingByVmId.clear();
    notify();
  }
};
