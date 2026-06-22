import { useState } from 'react';
import { Dropdown, DropdownItem, DropdownList, MenuToggle } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';

import type { ComputeInstance } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';

import { VmDeleteConfirmModal } from './DetailsPage/VmDeleteConfirmModal';
import { usePatchComputeInstance } from '../../api/v1/compute-instance';

interface VmActionsMenuProps {
  vm: ComputeInstance;
}

export const VmActionsMenu = ({ vm }: VmActionsMenuProps) => {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const patchVm = usePatchComputeInstance();

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
          onSuccess={() => setDeleteOpen(false)}
        />
      )}
      <Dropdown
        isOpen={open}
        onOpenChange={setOpen}
        toggle={(ref) => (
          <MenuToggle
            ref={ref}
            variant="plain"
            onClick={() => setOpen((o) => !o)}
            aria-label={`Actions for ${vm.metadata?.name ?? vm.id}`}
          >
            <EllipsisVIcon />
          </MenuToggle>
        )}
        popperProps={{ position: 'right' }}
      >
        <DropdownList>
          <DropdownItem
            value="start"
            isDisabled={!canStart}
            onClick={() => {
              if (!canStart) {
                return;
              }
              patchVm.mutate({ id: vm.id, powerAction: 'start' });
              setOpen(false);
            }}
          >
            Start
          </DropdownItem>
          <DropdownItem
            value="stop"
            isDisabled={!canStop}
            onClick={() => {
              if (!canStop) {
                return;
              }
              patchVm.mutate({ id: vm.id, powerAction: 'stop' });
              setOpen(false);
            }}
          >
            Stop
          </DropdownItem>
          <DropdownItem
            value="restart"
            isDisabled={!canRestart}
            onClick={() => {
              if (!canRestart) {
                return;
              }
              patchVm.mutate({ id: vm.id, powerAction: 'restart' });
              setOpen(false);
            }}
          >
            Restart
          </DropdownItem>
          <DropdownItem
            value="delete"
            isDisabled={!canDelete}
            onClick={() => {
              if (!canDelete) {
                return;
              }
              setDeleteOpen(true);
              setOpen(false);
            }}
          >
            Delete
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    </>
  );
};
