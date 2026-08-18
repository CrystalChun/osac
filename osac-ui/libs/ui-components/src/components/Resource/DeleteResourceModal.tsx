import { useState } from 'react';
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

import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface DeleteResourceModalProps {
  resourceName: string;
  onDelete: () => Promise<unknown>;
  onClose: () => void;
  onSuccess: () => void;
  label: string;
  errorLabel: string;
}

const DeleteResourceModal = ({
  label,
  errorLabel,
  onDelete,
  resourceName,
  onClose,
  onSuccess,
}: DeleteResourceModalProps) => {
  const [isPending, setIsPending] = useState(false);

  const [error, setError] = useState<unknown>();
  const { t } = useTranslation();

  return (
    <Modal
      variant="small"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="delete-confirm-title"
    >
      <ModalHeader
        title={t('Delete {{name}}?', { name: resourceName })}
        titleIconVariant="warning"
        labelId="delete-confirm-title"
      />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>{label}</StackItem>
          {!!error && (
            <StackItem>
              <Alert variant="danger" title={errorLabel} isInline>
                {getErrorMessage(error)}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="danger"
          onClick={async () => {
            try {
              setIsPending(true);
              await onDelete();
              onSuccess();
            } catch (e) {
              setError(e);
            } finally {
              setIsPending(false);
            }
          }}
          isDisabled={isPending}
          isLoading={isPending}
        >
          {t('Delete')}
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteResourceModal;
