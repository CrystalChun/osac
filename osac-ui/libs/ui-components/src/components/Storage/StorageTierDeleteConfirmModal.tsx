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

import type { StorageTier } from '@osac/types/private';

import { useDeleteStorageTier } from '../../api/v1/private/storage-tiers';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface StorageTierDeleteConfirmModalProps {
  tier: StorageTier;
  onClose: () => void;
  onSuccess: () => void;
}

const StorageTierDeleteConfirmModal = ({
  tier,
  onClose,
  onSuccess,
}: StorageTierDeleteConfirmModalProps) => {
  const { t } = useTranslation();
  const { mutate, isPending, error } = useDeleteStorageTier();

  const tierName = tier.metadata?.name ?? tier.id;

  return (
    <Modal
      variant="small"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="storage-tier-delete-confirm-title"
    >
      <ModalHeader
        title={t('Delete {{name}}?', { name: tierName })}
        titleIconVariant="warning"
        labelId="storage-tier-delete-confirm-title"
      />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t('This permanently deletes the storage tier. This action cannot be undone.')}
          </StackItem>
          {error && (
            <StackItem>
              <Alert variant="danger" title={t('Failed to delete storage tier')} isInline>
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
          onClick={() => mutate(tier.id, { onSuccess })}
          isDisabled={isPending}
          isLoading={isPending}
        >
          {t('Delete')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default StorageTierDeleteConfirmModal;
