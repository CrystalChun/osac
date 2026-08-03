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

import type { Tenant } from '@osac/types/private';

import { useDeleteTenant } from '../../api/v1/private/tenant';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface TenantDeleteConfirmModalProps {
  tenant: Tenant;
  onClose: () => void;
  onSuccess: () => void;
}

const TenantDeleteConfirmModal = ({
  tenant,
  onClose,
  onSuccess,
}: TenantDeleteConfirmModalProps) => {
  const { t } = useTranslation();
  const { mutate, isPending, error } = useDeleteTenant();

  const tenantName = tenant.metadata?.name ?? tenant.id;

  return (
    <Modal
      variant="small"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="tenant-delete-confirm-title"
    >
      <ModalHeader
        title={t('Delete {{name}}?', { name: tenantName })}
        titleIconVariant="warning"
        labelId="tenant-delete-confirm-title"
      />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t(
              'This permanently deletes the tenant and all its resources. This action cannot be undone.',
            )}
          </StackItem>
          {error && (
            <StackItem>
              <Alert variant="danger" title={t('Failed to delete tenant')} isInline>
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
          onClick={() => mutate(tenant.id, { onSuccess })}
          isDisabled={isPending}
          isLoading={isPending}
        >
          {t('Delete')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default TenantDeleteConfirmModal;
