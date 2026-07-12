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

import type { BareMetalInstance } from '@osac/types';

import { useDeleteBareMetalInstance } from '../../api/v1/baremetal-instance';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface BareMetalDeleteConfirmModalProps {
  instance: BareMetalInstance;
  onClose: () => void;
  onSuccess: () => void;
}

const BareMetalDeleteConfirmModal = ({
  instance,
  onClose,
  onSuccess,
}: BareMetalDeleteConfirmModalProps) => {
  const { t } = useTranslation();
  const deleteInstance = useDeleteBareMetalInstance();

  const name = instance.metadata?.name ?? instance.id;

  const onDelete = () => {
    deleteInstance.reset();
    deleteInstance.mutate(instance.id, { onSuccess });
  };

  return (
    <Modal
      variant="small"
      isOpen
      onClose={deleteInstance.isPending ? undefined : onClose}
      aria-labelledby="bm-delete-confirm-title"
    >
      <ModalHeader
        title={t('Delete {{name}}?', { name })}
        titleIconVariant="warning"
        labelId="bm-delete-confirm-title"
      />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t('This permanently deletes the bare metal instance. This action cannot be undone.')}
          </StackItem>
          {deleteInstance.error && (
            <StackItem>
              <Alert variant="danger" title={t('Failed to delete bare metal instance')} isInline>
                {getErrorMessage(deleteInstance.error)}
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
          isDisabled={deleteInstance.isPending}
          isLoading={deleteInstance.isPending}
        >
          {t('Delete')}
        </Button>
        <Button key="cancel" variant="link" onClick={onClose} isDisabled={deleteInstance.isPending}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default BareMetalDeleteConfirmModal;
