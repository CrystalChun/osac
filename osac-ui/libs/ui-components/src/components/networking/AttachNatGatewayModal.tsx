import { useMemo, useState } from 'react';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  FormGroup,
  PageSection,
  PageSectionTypes,
  Stack,
  StackItem,
  Title,
  Wizard,
  WizardFooterWrapper,
  WizardStep,
  useWizardContext,
} from '@patternfly/react-core';
import { Formik } from 'formik';
import { useFormikContext } from 'formik';
import type { TFunction } from 'i18next';
import * as Yup from 'yup';

import { ExternalIPState, ExternalIPs, NATGateways, type VirtualNetwork } from '@osac/types';

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

interface AttachNatGatewayWizardFooterProps {
  error: unknown;
  isBlocked: boolean;
  onCancel: () => void;
}

const AttachNatGatewayWizardFooter = ({
  error,
  isBlocked,
  onCancel,
}: AttachNatGatewayWizardFooterProps) => {
  const { t } = useTranslation();
  const { activeStep, goToStepByIndex, steps } = useWizardContext();
  const { isSubmitting, submitForm, validateForm } = useFormikContext<AttachNatGatewayFormValues>();
  const [showValidationError, setShowValidationError] = useState(false);
  const stepIndex = activeStep?.index ?? 1;
  const isFirstStep = stepIndex <= 1;
  const isLastStep = stepIndex >= steps.length;

  const handleNext = async () => {
    if (isSubmitting || isBlocked) {
      return;
    }

    const errors = await validateForm();
    if (Object.keys(errors).length > 0) {
      setShowValidationError(true);
      return;
    }

    setShowValidationError(false);
    if (isLastStep) {
      await submitForm();
    } else {
      goToStepByIndex(stepIndex + 1);
    }
  };

  return (
    <WizardFooterWrapper>
      <Stack hasGutter>
        {showValidationError && (
          <StackItem>
            <Alert
              variant="danger"
              isInline
              title={t('Fix the highlighted errors before continuing.')}
            />
          </StackItem>
        )}
        {!!error && isLastStep && (
          <StackItem>
            <Alert variant="danger" title={t('Failed to attach NAT gateway')} isInline>
              {getErrorMessage(error)}
            </Alert>
          </StackItem>
        )}
        <StackItem>
          <ActionList>
            <ActionListGroup>
              <ActionListItem>
                <Button
                  variant="secondary"
                  onClick={() => goToStepByIndex(stepIndex - 1)}
                  isDisabled={isFirstStep || isSubmitting}
                >
                  {t('Back')}
                </Button>
              </ActionListItem>
              <ActionListItem>
                <Button
                  variant="primary"
                  onClick={() => void handleNext()}
                  isDisabled={isBlocked || isSubmitting}
                  isLoading={isSubmitting}
                >
                  {isLastStep ? t('Attach') : t('Next')}
                </Button>
              </ActionListItem>
              <ActionListItem>
                <Button variant="link" onClick={onCancel} isDisabled={isSubmitting}>
                  {t('Cancel')}
                </Button>
              </ActionListItem>
            </ActionListGroup>
          </ActionList>
        </StackItem>
      </Stack>
    </WizardFooterWrapper>
  );
};

const validationSchema = (t: TFunction) =>
  Yup.object({
    metadata: Yup.object({
      name: resourceNameSchema(t),
    }),
    externalIpId: Yup.string().required(t('An external IP is required')),
  });

export const AttachNatGatewayModal = ({ virtualNetwork, onClose }: AttachNatGatewayModalProps) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState('nat-gateway');
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
        .filter(
          (ip) =>
            ip.id &&
            ip.status?.state === ExternalIPState.EXTERNAL_IP_STATE_ALLOCATED &&
            !usedExternalIpIds.has(ip.id),
        )
        .map((ip) => ({
          value: ip.id,
          label: `${ip.metadata?.name ?? ip.id} · ${ip.status?.address ?? '—'}`,
        })),
    [externalIpResponse?.items, usedExternalIpIds],
  );

  const noExternalIpsAvailable =
    !isLoadingExternalIps && !externalIpsError && externalIpOptions.length === 0;

  const handleClose = () => {
    setCurrentStep('nat-gateway');
    onClose();
  };

  return (
    <Formik<AttachNatGatewayFormValues>
      initialValues={{
        metadata: { name: '' },
        externalIpId: '',
      }}
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
          // surfaced via the mutation error state
        }
      }}
    >
      {({ isSubmitting, values }) => (
        <>
          <PageSection hasBodyWrapper={false}>
            <Stack hasGutter>
              <StackItem>
                <Breadcrumb>
                  <BreadcrumbItem>
                    <Button variant="link" isInline onClick={handleClose}>
                      {t('Virtual networks')}
                    </Button>
                  </BreadcrumbItem>
                  <BreadcrumbItem isActive>{t('Attach NAT gateway')}</BreadcrumbItem>
                </Breadcrumb>
              </StackItem>
              <StackItem>
                <Title headingLevel="h1" size="3xl">
                  {t('Attach NAT gateway')}
                </Title>
              </StackItem>
            </Stack>
          </PageSection>
          <PageSection
            hasBodyWrapper={false}
            isFilled
            type={PageSectionTypes.wizard}
            aria-label={t('Attach NAT gateway wizard')}
          >
            <Wizard
              navAriaLabel={t('Attach NAT gateway steps')}
              isVisitRequired
              footer={
                <AttachNatGatewayWizardFooter
                  error={createNatGateway.error}
                  isBlocked={noExternalIpsAvailable || Boolean(externalIpsError)}
                  onCancel={handleClose}
                />
              }
              onStepChange={(_, step) => setCurrentStep(step.id as string)}
            >
              <WizardStep id="nat-gateway" name={t('NAT gateway')}>
                {currentStep === 'nat-gateway' && (
                  <Stack hasGutter>
                    <StackItem>
                      <Content component="p">
                        {t(
                          'Provides outbound internet access for workloads in this virtual network.',
                        )}
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
                        <FormGroup
                          label={t('Virtual network')}
                          fieldId="attach-nat-gateway-network"
                        >
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
                          helperText={t('Standard edge NAT for outbound internet access.')}
                          options={externalIpOptions}
                          autoSelectSingleOption
                        />
                      </OsacForm>
                    </StackItem>
                  </Stack>
                )}
              </WizardStep>
              <WizardStep id="review" name={t('Review')}>
                {currentStep === 'review' && (
                  <DescriptionList isCompact aria-label={t('Review')}>
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Virtual network')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        {virtualNetwork.metadata?.name ?? virtualNetwork.id}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('IPv4 CIDR')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        <code>{virtualNetwork.spec?.ipv4Cidr ?? '—'}</code>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        {values.metadata.name || '—'}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('External IP')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        {externalIpOptions.find((option) => option.value === values.externalIpId)
                          ?.label ?? '—'}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                )}
              </WizardStep>
            </Wizard>
          </PageSection>
        </>
      )}
    </Formik>
  );
};
