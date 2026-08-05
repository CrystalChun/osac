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

import type { RoleBinding } from '@osac/types';

import { useDeleteRoleBinding } from '../../api/v1/role-binding';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface RoleBindingDeleteModalProps {
  roleBinding: RoleBinding;
  onClose: () => void;
  onSuccess: () => void;
}

const RoleBindingDeleteModal = ({
  roleBinding,
  onClose,
  onSuccess,
}: RoleBindingDeleteModalProps) => {
  const { t } = useTranslation();
  const { mutate, isPending, error } = useDeleteRoleBinding();

  return (
    <Modal
      variant="small"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="role-binding-delete-confirm-title"
    >
      <ModalHeader
        title={t('Delete role binding?')}
        titleIconVariant="warning"
        labelId="role-binding-delete-confirm-title"
      />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t(
              'This permanently deletes the role binding. Users will lose the permissions granted by this binding. This action cannot be undone.',
            )}
          </StackItem>
          {error && (
            <StackItem>
              <Alert variant="danger" title={t('Failed to delete role binding')} isInline>
                {getErrorMessage(error)}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="danger"
          onClick={() => mutate(roleBinding.id, { onSuccess })}
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

export default RoleBindingDeleteModal;
