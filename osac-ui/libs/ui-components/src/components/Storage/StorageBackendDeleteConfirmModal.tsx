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

import type { StorageBackend } from '@osac/types/private';

import { useDeleteStorageBackend } from '../../api/v1/private/storage-backends';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface StorageBackendDeleteConfirmModalProps {
  backend: StorageBackend;
  onClose: () => void;
  onSuccess: () => void;
}

const StorageBackendDeleteConfirmModal = ({
  backend,
  onClose,
  onSuccess,
}: StorageBackendDeleteConfirmModalProps) => {
  const { t } = useTranslation();
  const { mutate, isPending, error } = useDeleteStorageBackend();

  const backendName = backend.metadata?.name ?? backend.id;

  return (
    <Modal
      variant="small"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="storage-backend-delete-confirm-title"
    >
      <ModalHeader
        title={t('Delete {{name}}?', { name: backendName })}
        titleIconVariant="warning"
        labelId="storage-backend-delete-confirm-title"
      />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t('This permanently deletes the storage backend. This action cannot be undone.')}
          </StackItem>
          {error && (
            <StackItem>
              <Alert variant="danger" title={t('Failed to delete storage backend')} isInline>
                {getErrorMessage(error)}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          {t('Cancel')}
        </Button>
        <Button
          variant="danger"
          onClick={() => mutate(backend.id, { onSuccess })}
          isDisabled={isPending}
          isLoading={isPending}
        >
          {t('Delete')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default StorageBackendDeleteConfirmModal;
