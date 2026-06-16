import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComputeInstance } from '@osac/types';
import { useVmPowerActionDisplay } from '@osac/ui-components/hooks/useVmPowerActionDisplay';
import { clearAllPowerPending } from '@osac/ui-components/vm/vmPowerPendingStore';
import { COMPUTE_INSTANCE_STATE } from '@osac/ui-components/vmDisplayState';

type VmState = NonNullable<ComputeInstance['status']>['state'];

const vm = (id: string, state: VmState): ComputeInstance => {
  return {
    id,
    metadata: { name: id },
    spec: { template: '', catalogItem: '' },
    status: {
      state,
      conditions: [],
      internalIpAddress: '',
      publicIpAddress: '',
    },
  };
};

describe('useVmPowerActionDisplay', () => {
  beforeEach(() => {
    clearAllPowerPending();
  });

  it('shows Stopping immediately then clears when API returns stopped', async () => {
    const patchMutate = vi.fn();
    const { result, rerender } = renderHook(
      ({ vms }: { vms: ComputeInstance[] }) => useVmPowerActionDisplay(vms, patchMutate),
      { initialProps: { vms: [vm('a', COMPUTE_INSTANCE_STATE.RUNNING)] } },
    );

    act(() => {
      result.current.runPowerAction(vm('a', COMPUTE_INSTANCE_STATE.RUNNING), 'stop');
    });
    expect(result.current.getDisplayState(vm('a', COMPUTE_INSTANCE_STATE.RUNNING))).toBe(
      'stopping',
    );

    rerender({ vms: [vm('a', COMPUTE_INSTANCE_STATE.RUNNING)] });
    expect(result.current.getDisplayState(vm('a', COMPUTE_INSTANCE_STATE.RUNNING))).toBe(
      'stopping',
    );

    rerender({ vms: [vm('a', COMPUTE_INSTANCE_STATE.STOPPING)] });
    expect(result.current.getDisplayState(vm('a', COMPUTE_INSTANCE_STATE.STOPPING))).toBe(
      'stopping',
    );

    rerender({ vms: [vm('a', COMPUTE_INSTANCE_STATE.STOPPED)] });
    await waitFor(() => {
      expect(result.current.getDisplayState(vm('a', COMPUTE_INSTANCE_STATE.STOPPED))).toBe(
        COMPUTE_INSTANCE_STATE.STOPPED,
      );
    });
  });

  it('restart: Restarting while API still running, Starting after stopped, done on running', async () => {
    const patchMutate = vi.fn();
    const { result, rerender } = renderHook(
      ({ vms }: { vms: ComputeInstance[] }) => useVmPowerActionDisplay(vms, patchMutate),
      { initialProps: { vms: [vm('a', COMPUTE_INSTANCE_STATE.RUNNING)] } },
    );

    act(() => {
      result.current.runPowerAction(vm('a', COMPUTE_INSTANCE_STATE.RUNNING), 'restart');
    });
    expect(patchMutate).toHaveBeenCalledWith(
      { id: 'a', powerAction: 'stop' },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
    expect(result.current.getDisplayState(vm('a', COMPUTE_INSTANCE_STATE.RUNNING))).toBe(
      'restarting',
    );

    rerender({ vms: [vm('a', COMPUTE_INSTANCE_STATE.RUNNING)] });
    expect(result.current.getDisplayState(vm('a', COMPUTE_INSTANCE_STATE.RUNNING))).toBe(
      'restarting',
    );

    rerender({ vms: [vm('a', COMPUTE_INSTANCE_STATE.STOPPED)] });
    await waitFor(() => {
      expect(result.current.getDisplayState(vm('a', COMPUTE_INSTANCE_STATE.STOPPED))).toBe(
        'starting',
      );
    });
    expect(patchMutate).toHaveBeenCalledWith(
      { id: 'a', powerAction: 'start' },
      expect.objectContaining({ onError: expect.any(Function) }),
    );

    rerender({ vms: [vm('a', COMPUTE_INSTANCE_STATE.RUNNING)] });
    expect(result.current.getDisplayState(vm('a', COMPUTE_INSTANCE_STATE.RUNNING))).toBe(
      'starting',
    );

    rerender({ vms: [vm('a', COMPUTE_INSTANCE_STATE.STARTING)] });
    rerender({ vms: [vm('a', COMPUTE_INSTANCE_STATE.RUNNING)] });
    await waitFor(() => {
      expect(result.current.getDisplayState(vm('a', COMPUTE_INSTANCE_STATE.RUNNING))).toBe(
        COMPUTE_INSTANCE_STATE.RUNNING,
      );
    });
    expect(result.current.isRestarting('a')).toBe(false);
  });
});
