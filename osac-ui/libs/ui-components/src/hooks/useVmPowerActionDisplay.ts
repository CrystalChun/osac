/**
 * flow: manage-virtual-machines
 * Immediate Starting / Stopping / Restarting badges; reconcile on each compute_instances list update.
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react';

import type { ComputeInstance } from '@osac/types';

import type { PatchComputeInstanceInput } from '../api/v1/compute-instance';
import {
  advancePendingPowerWatch,
  createPendingPowerWatch,
  resolveVmDisplayPowerState,
  shouldAdvanceRestartToStarting,
} from '../vm/vmPowerDisplay';
import {
  clearPowerPending,
  getPendingPowerAction,
  getPowerWatch,
  hasAnyPowerPending,
  isInRestartCycle,
  isRestartStartSent,
  listPendingPowerVmIds,
  markRestartStartSent,
  setPowerPending,
  setPowerWatch,
  subscribePowerPending,
  updatePowerPendingAction,
} from '../vm/vmPowerPendingStore';
import { COMPUTE_INSTANCE_STATE, readComputeInstanceState } from '../vmDisplayState';

type PatchMutate = (
  input: PatchComputeInstanceInput,
  options?: {
    onError?: (error: Error) => void;
  },
) => void;

type UseVmPowerActionDisplayOptions = {
  /** Poll list while a power action is pending. */
  invalidateInstances?: () => Promise<unknown>;
};

/** While a power action is pending, refresh list more often than the default interval. */
const PENDING_VM_LIST_POLL_MS = 10_000;

const powerPendingSnapshot = (): string => {
  return listPendingPowerVmIds()
    .map((id) => {
      const action = getPendingPowerAction(id);
      return `${id}:${action ?? ''}`;
    })
    .join('|');
};

export const useVmPowerActionDisplay = (
  vms: ComputeInstance[],
  patchMutate: PatchMutate,
  options: UseVmPowerActionDisplayOptions = {},
) => {
  const { invalidateInstances } = options;
  const pendingSnapshot = useSyncExternalStore(
    subscribePowerPending,
    powerPendingSnapshot,
    powerPendingSnapshot,
  );

  const getDisplayState = useCallback((vm: ComputeInstance) => {
    return resolveVmDisplayPowerState(readComputeInstanceState(vm), getPendingPowerAction(vm.id));
  }, []);

  const isPowerActionPending = useCallback(
    (vmId: string) => getPendingPowerAction(vmId) != null,
    [],
  );

  const isRestarting = useCallback((vmId: string) => isInRestartCycle(vmId), []);

  useEffect(() => {
    if (!hasAnyPowerPending() || !invalidateInstances) {
      return;
    }
    const id = window.setInterval(() => {
      void invalidateInstances();
    }, PENDING_VM_LIST_POLL_MS);
    return () => window.clearInterval(id);
  }, [invalidateInstances, pendingSnapshot]);

  useEffect(() => {
    if (!hasAnyPowerPending()) {
      return;
    }

    for (const id of listPendingPowerVmIds()) {
      const action = getPendingPowerAction(id);
      if (!action) {
        continue;
      }

      const vm = vms.find((v) => v.id === id);
      if (!vm) {
        clearPowerPending(id);
        continue;
      }

      const apiState = readComputeInstanceState(vm);

      if (action === 'restarting') {
        if (apiState === COMPUTE_INSTANCE_STATE.FAILED) {
          clearPowerPending(id);
          continue;
        }
        if (shouldAdvanceRestartToStarting(apiState)) {
          if (!isRestartStartSent(id)) {
            markRestartStartSent(id);
            patchMutate(
              { id, powerAction: 'start' },
              {
                onError: () => {
                  clearPowerPending(id);
                },
              },
            );
          }
          if (getPendingPowerAction(id) === 'restarting') {
            updatePowerPendingAction(id, 'starting');
          }
        }
        continue;
      }

      const watch = getPowerWatch(id) ?? createPendingPowerWatch();
      const { watch: nextWatch, clear } = advancePendingPowerWatch(action, apiState, watch);
      setPowerWatch(id, nextWatch);
      if (clear) {
        clearPowerPending(id);
      }
    }
  }, [vms, patchMutate]);

  const runPowerAction = useCallback(
    (vm: ComputeInstance, action: 'start' | 'stop' | 'restart') => {
      const id = vm.id;
      if (action === 'restart') {
        setPowerPending(id, 'restarting', { restartCycle: true });
        patchMutate({ id, powerAction: 'stop' }, { onError: () => clearPowerPending(id) });
        return;
      }
      if (action === 'start') {
        setPowerPending(id, 'starting');
        patchMutate({ id, powerAction: 'start' }, { onError: () => clearPowerPending(id) });
        return;
      }
      setPowerPending(id, 'stopping');
      patchMutate({ id, powerAction: 'stop' }, { onError: () => clearPowerPending(id) });
    },
    [patchMutate],
  );

  return {
    getDisplayState,
    runPowerAction,
    isPowerActionPending,
    isRestarting,
  };
};
