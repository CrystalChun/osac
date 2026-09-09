import { useMemo } from 'react';
import {
  Alert,
  Button,
  Content,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { Formik } from 'formik';
import type { TFunction } from 'i18next';
import * as Yup from 'yup';

import { ExternalIPs, NATGateways, type VirtualNetwork } from '@osac/types';

import { useApiQueryClient } from '../../api/use-api-query';
import {
  useCreateResource,
  useInvalidateServiceQueries,
  useListResource,
} from '../../api/use-resource';
import {
  invalidateVirtualNetworksQueries,
  unallocatedExternalIpFilter,
} from '../../api/v1/networking';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import { resourceNameSchema } from '../../validation/resource-name';
import NameField from '../catalogProvision/wizard/fields/NameField';
import OsacForm from '../Form/OsacForm';
import { SelectField } from '../Form/SelectField';

export interface AttachNatGatewayModalProps {
  virtualNetwork: Pick<VirtualNetwork, 'id'> & {
    metadata?: { name?: string };
    spec?: { ipv4Cidr?: string };
  };
  onClose: () => void;
}

interface AttachNatGatewayFormValues {
  metadata: {
    name: string;
  };
  externalIpId: string;
}

const validationSchema = (t: TFunction) =>
  Yup.object({
    metadata: Yup.object({
      name: resourceNameSchema(t),
    }),
    externalIpId: Yup.string().required(t('An external IP is required')),
  });

export const AttachNatGatewayModal = ({ virtualNetwork, onClose }: AttachNatGatewayModalProps) => {
  const { t } = useTranslation();
  const queryClient = useApiQueryClient();
  const invalidateService = useInvalidateServiceQueries();
  const {
    data: externalIpResponse,
    isLoading: isLoadingExternalIps,
    error: externalIpsError,
  } = useListResource(ExternalIPs, { filter: unallocatedExternalIpFilter() });
  const { data: natGatewayResponse } = useListResource(NATGateways);
  const createNatGateway = useCreateResource(NATGateways, {
    onSuccess: async () => {
      await invalidateService(ExternalIPs);
      await invalidateVirtualNetworksQueries(queryClient);
    },
  });

  const usedExternalIpIds = useMemo(
    () =>
      new Set(
        (natGatewayResponse?.items ?? [])
          .map((gateway) => gateway.spec?.externalIp?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    [natGatewayResponse?.items],
  );

  const externalIpOptions = useMemo(
    () =>
      (externalIpResponse?.items ?? [])
        .filter((ip) => ip.id && !usedExternalIpIds.has(ip.id))
        .map((ip) => ({
          value: ip.id,
          label: `${ip.metadata?.name ?? ip.id} · ${ip.status?.address ?? '—'}`,
        })),
    [externalIpResponse?.items, usedExternalIpIds],
  );

  const noExternalIpsAvailable =
    !isLoadingExternalIps && !externalIpsError && externalIpOptions.length === 0;

  return (
    <Formik<AttachNatGatewayFormValues>
      initialValues={{ metadata: { name: '' }, externalIpId: '' }}
      validationSchema={validationSchema(t)}
      onSubmit={async (values) => {
        try {
          await createNatGateway.mutateAsync({
            object: {
              metadata: { name: values.metadata.name },
              spec: {
                virtualNetwork: { id: virtualNetwork.id },
                externalIp: { id: values.externalIpId },
              },
            },
          });
          onClose();
        } catch {
          // surfaced via createNatGateway.error
        }
      }}
    >
      {({ submitForm, isSubmitting }) => (
        <Modal
          variant="small"
          isOpen
          onClose={isSubmitting ? undefined : onClose}
          aria-labelledby="attach-nat-gateway-title"
        >
          <ModalHeader title={t('Attach NAT gateway')} labelId="attach-nat-gateway-title" />
          <ModalBody>
            <Stack hasGutter>
              <StackItem>
                <Content component="p">
                  {t('Provides outbound internet access for workloads in this virtual network.')}
                </Content>
              </StackItem>
              {noExternalIpsAvailable && (
                <StackItem>
                  <Alert variant="warning" title={t('No unallocated external IPs')} isInline>
                    {t(
                      'Allocate an External IP that is not in use, or contact your administrator.',
                    )}
                  </Alert>
                </StackItem>
              )}
              {!!externalIpsError && (
                <StackItem>
                  <Alert variant="danger" title={t('Error loading external IPs')} isInline>
                    {getErrorMessage(externalIpsError)}
                  </Alert>
                </StackItem>
              )}
              <StackItem>
                <OsacForm>
                  <FormGroup label={t('Virtual network')} fieldId="attach-nat-gateway-network">
                    {virtualNetwork.metadata?.name ?? virtualNetwork.id}
                  </FormGroup>
                  <FormGroup label={t('IPv4 CIDR')} fieldId="attach-nat-gateway-cidr">
                    <code>{virtualNetwork.spec?.ipv4Cidr ?? '—'}</code>
                  </FormGroup>
                  <NameField isDisabled={isSubmitting} />
                  <SelectField
                    name="externalIpId"
                    label={t('External IP')}
                    fieldId="attach-nat-gateway-external-ip"
                    isRequired
                    isLoading={isLoadingExternalIps}
                    isDisabled={noExternalIpsAvailable || Boolean(externalIpsError)}
                    placeholder={t('Select an external IP')}
                    helperText={t('This IP becomes the SNAT source for the virtual network.')}
                    options={externalIpOptions}
                    autoSelectSingleOption
                  />
                </OsacForm>
              </StackItem>
              {createNatGateway.error && (
                <StackItem>
                  <Alert variant="danger" title={t('Failed to attach NAT gateway')} isInline>
                    {getErrorMessage(createNatGateway.error)}
                  </Alert>
                </StackItem>
              )}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="link" onClick={onClose} isDisabled={isSubmitting}>
              {t('Cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={submitForm}
              isDisabled={isSubmitting || noExternalIpsAvailable || Boolean(externalIpsError)}
              isLoading={isSubmitting}
            >
              {t('Attach')}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </Formik>
  );
};
