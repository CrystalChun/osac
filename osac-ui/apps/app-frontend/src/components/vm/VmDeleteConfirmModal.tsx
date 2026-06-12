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
import type { ComputeInstance } from '@osac/api-contracts/types';
import { getErrorMessage } from '@osac/ui-components/utils/error';

import { useDeleteVm, usePatchVm } from '../../api/hooks';

interface VmDeleteConfirmModalProps {
  vm: ComputeInstance;
  onClose: () => void;
  onSuccess: () => void;
}

export const VmDeleteConfirmModal = ({ vm, onClose, onSuccess }: VmDeleteConfirmModalProps) => {
  const [isPending, setIsPending] = React.useState(false);
  const deleteVm = useDeleteVm();
  const patchVm = usePatchVm();

  const isStopped = vm.status.state === 'stopped';

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
        title={`Delete ${vm.metadata.name}?`}
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
