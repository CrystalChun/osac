import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Flex } from '@patternfly/react-core';
import DumpsterIcon from '@patternfly/react-icons/dist/esm/icons/dumpster-icon';
import PlayIcon from '@patternfly/react-icons/dist/esm/icons/play-icon';
import StopIcon from '@patternfly/react-icons/dist/esm/icons/stop-icon';
import SyncAltIcon from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';

import type { ComputeInstance } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';

import { VmDeleteConfirmModal } from './VmDeleteConfirmModal';
import { usePatchComputeInstance } from '../../../api/v1/compute-instance';
import { useVmPowerActionDisplay } from '../../../hooks/useVmPowerActionDisplay';

interface VmDetailsActionButtonsProps {
  vm: ComputeInstance;
}

export const VmDetailsActionButtons = ({ vm }: VmDetailsActionButtonsProps) => {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const patchVm = usePatchComputeInstance();
  const { runPowerAction } = useVmPowerActionDisplay([vm], patchVm.mutate);

  const state = vm.status?.state;
  const canStart = state === ComputeInstanceState.STOPPED;
  const canStop = state === ComputeInstanceState.RUNNING || state === ComputeInstanceState.PAUSED;
  const canRestart =
    state === ComputeInstanceState.RUNNING || state === ComputeInstanceState.PAUSED;
  const canDelete =
    state !== ComputeInstanceState.DELETING && state !== ComputeInstanceState.STARTING;

  return (
    <>
      {deleteOpen && (
        <VmDeleteConfirmModal
          vm={vm}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => navigate('/vms')}
        />
      )}
      <Flex
        justifyContent={{ default: 'justifyContentFlexEnd' }}
        spaceItems={{ default: 'spaceItemsSm' }}
        flexWrap={{ default: 'wrap' }}
      >
        <Button
          variant="primary"
          icon={<PlayIcon />}
          isDisabled={!canStart}
          onClick={() => {
            if (canStart) {
              runPowerAction(vm, 'start');
            }
          }}
        >
          Start
        </Button>
        <Button
          variant="secondary"
          icon={<StopIcon />}
          isDisabled={!canStop}
          onClick={() => {
            if (canStop) {
              runPowerAction(vm, 'stop');
            }
          }}
        >
          Stop
        </Button>
        <Button
          variant="secondary"
          icon={<SyncAltIcon />}
          isDisabled={!canRestart}
          onClick={() => {
            if (canRestart) {
              runPowerAction(vm, 'restart');
            }
          }}
        >
          Restart
        </Button>
        <Button
          variant="danger"
          icon={<DumpsterIcon />}
          isDisabled={!canDelete}
          onClick={() => {
            if (canDelete) {
              setDeleteOpen(true);
            }
          }}
        >
          Delete
        </Button>
      </Flex>
    </>
  );
};
