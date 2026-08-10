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

import type { InstanceType as PrivateInstanceType } from '@osac/types/private';

import { useDeleteInstanceType } from '../../api/v1/private/instance-type';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface InstanceTypeDeleteConfirmModalProps {
  instanceType: PrivateInstanceType;
  onClose: () => void;
  onSuccess: () => void;
}

const InstanceTypeDeleteConfirmModal = ({
  instanceType,
  onClose,
  onSuccess,
}: InstanceTypeDeleteConfirmModalProps) => {
  const { t } = useTranslation();
  const deleteInstanceType = useDeleteInstanceType();

  const onDelete = () => {
    deleteInstanceType.reset();
    deleteInstanceType.mutate(instanceType.id, { onSuccess });
  };

  return (
    <Modal
      variant="small"
      isOpen
      onClose={deleteInstanceType.isPending ? undefined : onClose}
      aria-labelledby="instance-type-delete-confirm-title"
    >
      <ModalHeader
        title={t('Delete {{name}}?', { name: instanceType.metadata?.name || instanceType.id })}
        titleIconVariant="warning"
        labelId="instance-type-delete-confirm-title"
      />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t('This permanently deletes the instance type. This action cannot be undone.')}
          </StackItem>
          {deleteInstanceType.error && (
            <StackItem>
              <Alert variant="danger" title={t('Failed to delete instance type')} isInline>
                {getErrorMessage(deleteInstanceType.error)}
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
          isDisabled={deleteInstanceType.isPending}
          isLoading={deleteInstanceType.isPending}
        >
          {t('Delete')}
        </Button>
        <Button
          key="cancel"
          variant="link"
          onClick={onClose}
          isDisabled={deleteInstanceType.isPending}
        >
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default InstanceTypeDeleteConfirmModal;
