import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Flex } from '@patternfly/react-core';
import DumpsterIcon from '@patternfly/react-icons/dist/esm/icons/dumpster-icon';
import GlobeIcon from '@patternfly/react-icons/dist/esm/icons/globe-icon';
import PlayIcon from '@patternfly/react-icons/dist/esm/icons/play-icon';
import StopIcon from '@patternfly/react-icons/dist/esm/icons/stop-icon';
import SyncAltIcon from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';

import type { ComputeInstance } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';

import AttachPublicIpModal from './AttachPublicIpModal';
import VmDeleteConfirmModal from './VmDeleteConfirmModal';
import { usePatchComputeInstance } from '../../../api/v1/compute-instance';

interface VmDetailsActionButtonsProps {
  vm: ComputeInstance;
}

const VmDetailsActionButtons = ({ vm }: VmDetailsActionButtonsProps) => {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [attachPublicIpOpen, setAttachPublicIpOpen] = useState(false);
  const patchVm = usePatchComputeInstance();

  const state = vm.status?.state;
  const canStart = state === ComputeInstanceState.STOPPED;
  const canStop = state === ComputeInstanceState.RUNNING || state === ComputeInstanceState.PAUSED;
  const canRestart =
    state === ComputeInstanceState.RUNNING || state === ComputeInstanceState.PAUSED;
  const canDelete =
    state !== ComputeInstanceState.DELETING && state !== ComputeInstanceState.STARTING;
  const canAttachPublicIp = state === ComputeInstanceState.RUNNING && !vm.status?.publicIpAddress;

  return (
    <>
      {deleteOpen && (
        <VmDeleteConfirmModal
          vm={vm}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => navigate('/vms')}
        />
      )}
      {attachPublicIpOpen && (
        <AttachPublicIpModal
          vm={vm}
          onClose={() => setAttachPublicIpOpen(false)}
          onSuccess={() => setAttachPublicIpOpen(false)}
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
              patchVm.mutate({ id: vm.id, powerAction: 'start' });
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
              patchVm.mutate({ id: vm.id, powerAction: 'stop' });
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
              patchVm.mutate({ id: vm.id, powerAction: 'restart' });
            }
          }}
        >
          Restart
        </Button>
        <Button
          variant="secondary"
          icon={<GlobeIcon />}
          isDisabled={!canAttachPublicIp}
          onClick={() => {
            if (canAttachPublicIp) {
              setAttachPublicIpOpen(true);
            }
          }}
        >
          Attach public IP
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

export default VmDetailsActionButtons;
