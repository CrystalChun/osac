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

import { ExternalIPs, type NATGateway, NATGateways } from '@osac/types';

import { useApiQueryClient } from '../../api/use-api-query';
import { useDeleteResource, useInvalidateServiceQueries } from '../../api/use-resource';
import { invalidateVirtualNetworksQueries } from '../../api/v1/networking';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

export interface DetachNatGatewayModalProps {
  natGateway: NATGateway;
  onClose: () => void;
}

export const DetachNatGatewayModal = ({ natGateway, onClose }: DetachNatGatewayModalProps) => {
  const { t } = useTranslation();
  const queryClient = useApiQueryClient();
  const invalidateService = useInvalidateServiceQueries();
  const deleteNatGateway = useDeleteResource(NATGateways, {
    onSuccess: async () => {
      await invalidateService(ExternalIPs);
      await invalidateVirtualNetworksQueries(queryClient);
    },
  });

  const handleDetach = () => {
    deleteNatGateway.reset();
    deleteNatGateway.mutate(
      { id: natGateway.id },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      variant="small"
      isOpen
      onClose={deleteNatGateway.isPending ? undefined : onClose}
      aria-labelledby="detach-nat-gateway-title"
    >
      <ModalHeader
        title={t('Detach NAT gateway?')}
        titleIconVariant="warning"
        labelId="detach-nat-gateway-title"
      />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t(
              'This removes outbound internet access provided by {{name}} from the virtual network.',
              { name: natGateway.metadata?.name ?? natGateway.id },
            )}
          </StackItem>
          {!!deleteNatGateway.error && (
            <StackItem>
              <Alert variant="danger" title={t('Failed to detach NAT gateway')} isInline>
                {getErrorMessage(deleteNatGateway.error)}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="danger"
          onClick={handleDetach}
          isDisabled={deleteNatGateway.isPending}
          isLoading={deleteNatGateway.isPending}
        >
          {t('Detach')}
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={deleteNatGateway.isPending}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
