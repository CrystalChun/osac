import React from 'react';
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import {
  useDeleteComputeInstance,
  usePatchComputeInstance,
} from '@osac/ui-components/api/v1/compute-instance';
import { getErrorMessage } from '@osac/ui-components/utils/error';
import {
  COMPUTE_INSTANCE_STATE,
  readComputeInstanceState,
} from '@osac/ui-components/vmDisplayState';

import type { VmRow } from '../../api/vmRow';

interface VmDeleteConfirmModalProps {
  vm: VmRow;
  onClose: () => void;
  onSuccess: () => void;
}

export const VmDeleteConfirmModal = ({ vm, onClose, onSuccess }: VmDeleteConfirmModalProps) => {
  const [isPending, setIsPending] = React.useState(false);
  const deleteVm = useDeleteComputeInstance();
  const patchVm = usePatchComputeInstance();

  const isStopped = readComputeInstanceState(vm) === COMPUTE_INSTANCE_STATE.STOPPED;

  const onDelete = async () => {
    setIsPending(true);
    patchVm.reset();
    deleteVm.reset();
    try {
      if (!isStopped) {
        await patchVm.mutateAsync({ id: vm.id, powerAction: 'stop' });
      }
      await deleteVm.mutateAsync(vm.id);
      onSuccess();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      variant="small"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="vm-delete-confirm-title"
    >
      <ModalHeader
        title={`Delete ${vm.metadata?.name ?? vm.id}?`}
        titleIconVariant="warning"
        labelId="vm-delete-confirm-title"
      />
      <ModalBody>
        <Stack hasGutter>
          {!isStopped ? (
            <StackItem>
              This virtual machine is still running. It will be stopped first, then deleted
              permanently. This action cannot be undone.
            </StackItem>
          ) : (
            <StackItem>
              This permanently deletes the virtual machine. This action cannot be undone.
            </StackItem>
          )}
          {patchVm.error && (
            <StackItem>
              <Alert variant="danger" title="Failed to stop VM" isInline>
                {getErrorMessage(patchVm.error)}
              </Alert>
            </StackItem>
          )}
          {deleteVm.error && (
            <StackItem>
              <Alert variant="danger" title="Failed to delete VM" isInline>
                {getErrorMessage(deleteVm.error)}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button key="cancel" variant="link" onClick={onClose} isDisabled={isPending}>
          Cancel
        </Button>
        <Button
          key="delete"
          variant="danger"
          onClick={onDelete}
          isDisabled={isPending}
          isLoading={isPending}
        >
          Delete
        </Button>
      </ModalFooter>
    </Modal>
  );
};
