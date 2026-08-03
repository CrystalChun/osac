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

import { IdentityProvider } from '@osac/types';
import { useDeleteIdentityProvider } from '@osac/ui-components/api/v1/identity-provider';

import { getIdpName } from './utils';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface IdentityProviderDeleteModalProps {
  idp: IdentityProvider;
  onClose: () => void;
  onSuccess: () => void;
}

const IdentityProviderDeleteModal = ({
  idp,
  onClose,
  onSuccess,
}: IdentityProviderDeleteModalProps) => {
  const { t } = useTranslation();
  const { mutate, isPending, error } = useDeleteIdentityProvider();

  return (
    <Modal
      variant="small"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="idp-delete-confirm-title"
    >
      <ModalHeader
        title={t('Delete {{name}}?', { name: getIdpName(idp) })}
        titleIconVariant="warning"
        labelId="idp-delete-confirm-title"
      />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t(
              'This permanently deletes the Identity provider and all its resources. This action cannot be undone.',
            )}
          </StackItem>
          {error && (
            <StackItem>
              <Alert variant="danger" title={t('Failed to delete Identity provider')} isInline>
                {getErrorMessage(error)}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="danger"
          onClick={() => mutate(idp.id, { onSuccess })}
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

export default IdentityProviderDeleteModal;
