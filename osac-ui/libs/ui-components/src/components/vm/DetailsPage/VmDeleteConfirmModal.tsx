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

import type { ComputeInstance } from '@osac/types';

import { useDeleteComputeInstance } from '../../../api/v1/compute-instance';
import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/error';

interface VmDeleteConfirmModalProps {
  vm: ComputeInstance;
  onClose: () => void;
  onSuccess: () => void;
}

const VmDeleteConfirmModal = ({ vm, onClose, onSuccess }: VmDeleteConfirmModalProps) => {
  const { t } = useTranslation();
  const deleteVm = useDeleteComputeInstance();

  const onDelete = () => {
    deleteVm.reset();
    deleteVm.mutate(vm.id, { onSuccess });
  };

  return (
    <Modal
      variant="small"
      isOpen
      onClose={deleteVm.isPending ? undefined : onClose}
      aria-labelledby="vm-delete-confirm-title"
    >
      <ModalHeader
        title={t('Delete {{name}}?', { name: vm.metadata?.name || vm.id })}
        titleIconVariant="warning"
        labelId="vm-delete-confirm-title"
      />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t('This permanently deletes the compute instance. This action cannot be undone.')}
          </StackItem>
          {deleteVm.error && (
            <StackItem>
              <Alert variant="danger" title={t('Failed to delete compute instance')} isInline>
                {getErrorMessage(deleteVm.error)}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          key="delete"
          variant="danger"
          onClick={onDelete}
          isDisabled={deleteVm.isPending}
          isLoading={deleteVm.isPending}
        >
          {t('Delete')}
        </Button>
        <Button key="cancel" variant="link" onClick={onClose} isDisabled={deleteVm.isPending}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default VmDeleteConfirmModal;
