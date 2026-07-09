import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import { useDeleteSecurityGroup } from '../../api/v1/networking';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface SecurityGroupDeleteModalProps {
  onClose: () => void;
  onDeleted: () => void;
  securityGroupId: string;
}

export const SecurityGroupDeleteModal = ({
  onClose,
  onDeleted,
  securityGroupId,
}: SecurityGroupDeleteModalProps) => {
  const { t } = useTranslation();
  const deleteSecurityGroup = useDeleteSecurityGroup();

  const handleConfirm = async () => {
    try {
      await deleteSecurityGroup.mutateAsync(securityGroupId);
      onDeleted();
    } catch {
      // Error is surfaced via deleteSecurityGroup.error below
    }
  };

  return (
    <Modal
      variant={ModalVariant.small}
      isOpen
      onClose={onClose}
      aria-label={t('Delete security group')}
    >
      <ModalHeader title={t('Delete security group?')} titleIconVariant="warning" />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t(
              'This will permanently delete the security group and all its rules. This action cannot be undone.',
            )}
          </StackItem>
          {!!deleteSecurityGroup.error && (
            <StackItem>
              <Alert variant="danger" title={t('Error')} isInline>
                {getErrorMessage(deleteSecurityGroup.error)}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="danger"
          onClick={handleConfirm}
          isDisabled={deleteSecurityGroup.isPending}
          isLoading={deleteSecurityGroup.isPending}
        >
          {t('Delete')}
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={deleteSecurityGroup.isPending}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
