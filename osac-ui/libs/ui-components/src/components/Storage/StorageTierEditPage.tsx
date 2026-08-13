import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  PageSection,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { StorageProtocol } from '@osac/types/private';

import {
  STORAGE_BACKEND_READY_LIST_FILTER,
  usePrivateStorageBackend,
  usePrivateStorageBackends,
} from '../../api/v1/private/storage-backends';
import { usePrivateStorageTier, useUpdateStorageTier } from '../../api/v1/private/storage-tiers';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import { positiveIntegerSchema } from '../../validation/positive-integer';
import NameField from '../catalogProvision/wizard/fields/NameField';
import { CheckboxField } from '../Form/CheckboxField';
import { InputField } from '../Form/InputField';
import LeaveFormConfirmation from '../Form/LeaveFormConfirmation';
import OsacForm from '../Form/OsacForm';
import { RadioButtonField } from '../Form/RadioButtonField';
import { SelectField, type SelectFieldOption } from '../Form/SelectField';
import ListPageBody from '../Page/ListPageBody';

const TIERS_LIST_PATH = '/admin/infrastructure/storage/tiers';
const INT32_MAX = 2147483647;

const PROTOCOL_BY_VALUE: Record<'NFS' | 'BLOCK', StorageProtocol> = {
  NFS: StorageProtocol.NFS,
  BLOCK: StorageProtocol.BLOCK,
};

const VALUE_BY_PROTOCOL: Partial<Record<StorageProtocol, 'NFS' | 'BLOCK'>> = {
  [StorageProtocol.NFS]: 'NFS',
  [StorageProtocol.BLOCK]: 'BLOCK',
};

type QosFieldKey =
  | 'protocol'
  | 'maxReadBandwidthMbs'
  | 'maxWriteBandwidthMbs'
  | 'quotaGib'
  | 'encryptionEnabled';

const QOS_FIELD_KEYS: QosFieldKey[] = [
  'protocol',
  'maxReadBandwidthMbs',
  'maxWriteBandwidthMbs',
  'quotaGib',
  'encryptionEnabled',
];

interface BackendAssociationValues {
  backendId: string;
  protocol: '' | 'NFS' | 'BLOCK';
  maxReadBandwidthMbs: string;
  maxWriteBandwidthMbs: string;
  quotaGib: string;
  encryptionEnabled: boolean;
}

interface StorageTierEditFormValues {
  metadata: { name: string };
  description: string;
  backends: [BackendAssociationValues];
}

const StorageTierEditPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams() as { id: string };

  const { data: tier, isLoading: tierLoading, error: tierError } = usePrivateStorageTier(id);
  const assignedBackendId = tier?.spec?.backends[0]?.backendId ?? '';

  const { data: readyBackends = [], isLoading: backendsLoading } = usePrivateStorageBackends({
    filter: STORAGE_BACKEND_READY_LIST_FILTER,
  });
  const { data: assignedBackend } = usePrivateStorageBackend(assignedBackendId);
  const { mutateAsync, error: submitError } = useUpdateStorageTier();

  const backendOptions: SelectFieldOption[] = useMemo(() => {
    const options = readyBackends.map((backend) => ({
      value: backend.id,
      label: backend.metadata?.name ?? backend.id,
    }));
    if (assignedBackend && !options.some((option) => option.value === assignedBackend.id)) {
      options.push({
        value: assignedBackend.id,
        label: assignedBackend.metadata?.name ?? assignedBackend.id,
      });
    }
    return options;
  }, [readyBackends, assignedBackend]);

  const schema = useMemo(
    () =>
      Yup.object({
        description: Yup.string(),
        backends: Yup.array()
          .of(
            Yup.object({
              backendId: Yup.string().required(t('Backend is required')),
              protocol: Yup.string()
                .oneOf(['NFS', 'BLOCK'], t('Protocol is required'))
                .required(t('Protocol is required')),
              maxReadBandwidthMbs: positiveIntegerSchema(t, INT32_MAX),
              maxWriteBandwidthMbs: positiveIntegerSchema(t, INT32_MAX),
              quotaGib: positiveIntegerSchema(t, Number.MAX_SAFE_INTEGER),
              encryptionEnabled: Yup.boolean().required(),
            }),
          )
          .length(1)
          .required(),
      }),
    [t],
  );

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate(TIERS_LIST_PATH)}>
                {t('Storage tiers')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('Edit')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('Edit storage tier')}
          </Title>
        </Stack>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <ListPageBody isLoading={tierLoading} error={tierError}>
          {tier && (
            <StorageTierEditForm
              tierId={tier.id}
              tierVersion={tier.metadata?.version ?? 0}
              initialValues={{
                metadata: { name: tier.metadata?.name ?? '' },
                description: tier.spec?.description ?? '',
                backends: [
                  {
                    backendId: tier.spec?.backends[0]?.backendId ?? '',
                    protocol: tier.spec?.backends[0]
                      ? (VALUE_BY_PROTOCOL[tier.spec.backends[0].protocol] ?? '')
                      : '',
                    maxReadBandwidthMbs: String(tier.spec?.backends[0]?.maxReadBandwidthMbs ?? ''),
                    maxWriteBandwidthMbs: String(
                      tier.spec?.backends[0]?.maxWriteBandwidthMbs ?? '',
                    ),
                    quotaGib: String(tier.spec?.backends[0]?.quotaGib ?? ''),
                    encryptionEnabled: tier.spec?.backends[0]?.encryptionEnabled ?? false,
                  },
                ],
              }}
              schema={schema}
              backendOptions={backendOptions}
              backendsLoading={backendsLoading}
              mutateAsync={mutateAsync}
              submitError={submitError}
              navigate={navigate}
            />
          )}
        </ListPageBody>
      </PageSection>
    </>
  );
};

interface StorageTierEditFormProps {
  tierId: string;
  tierVersion: number;
  initialValues: StorageTierEditFormValues;
  schema: Yup.AnyObjectSchema;
  backendOptions: SelectFieldOption[];
  backendsLoading: boolean;
  mutateAsync: ReturnType<typeof useUpdateStorageTier>['mutateAsync'];
  submitError: unknown;
  navigate: (path: string) => void;
}

const StorageTierEditForm = ({
  tierId,
  tierVersion,
  initialValues,
  schema,
  backendOptions,
  backendsLoading,
  mutateAsync,
  submitError,
  navigate,
}: StorageTierEditFormProps) => {
  const { t } = useTranslation();

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={async (values) => {
        try {
          const currentBackend = values.backends[0];
          const descriptionChanged = values.description !== initialValues.description;

          const spec: { description?: string; backends: [Record<string, unknown>] } = {
            backends: [
              {
                backendId: currentBackend.backendId,
                protocol: PROTOCOL_BY_VALUE[currentBackend.protocol as 'NFS' | 'BLOCK'],
                maxReadBandwidthMbs: Number(currentBackend.maxReadBandwidthMbs),
                maxWriteBandwidthMbs: Number(currentBackend.maxWriteBandwidthMbs),
                quotaGib: BigInt(Math.trunc(Number(currentBackend.quotaGib))),
                encryptionEnabled: currentBackend.encryptionEnabled,
              },
            ],
          };
          if (descriptionChanged) {
            spec.description = values.description;
          }

          await mutateAsync({ id: tierId, metadata: { version: tierVersion }, spec });
          navigate(TIERS_LIST_PATH);
        } catch {
          // Surfaced via the mutation's own `error` state below; nothing further to do here.
        }
      }}
    >
      {({ values, submitForm, isSubmitting }) => {
        const qosChanged = QOS_FIELD_KEYS.some(
          (key) => values.backends[0][key] !== initialValues.backends[0][key],
        );

        return (
          <Stack hasGutter>
            <LeaveFormConfirmation />
            <StackItem>
              <OsacForm>
                <NameField isDisabled />
                <InputField
                  name="description"
                  label={t('Description')}
                  fieldId="tier-description"
                />
                <SelectField
                  name="backends[0].backendId"
                  label={t('Backend')}
                  fieldId="tier-backend"
                  isRequired
                  isLoading={backendsLoading}
                  placeholder={t('Select a backend')}
                  options={backendOptions}
                />
                <RadioButtonField
                  name="backends[0].protocol"
                  label={t('Protocol')}
                  fieldId="tier-protocol"
                  isRequired
                  isInline
                  options={[
                    { value: 'NFS', label: t('NFS') },
                    { value: 'BLOCK', label: t('Block') },
                  ]}
                />
                <InputField
                  name="backends[0].maxReadBandwidthMbs"
                  label={t('Max read bandwidth (MB/s)')}
                  fieldId="tier-max-read-bandwidth"
                  type="number"
                  isRequired
                />
                <InputField
                  name="backends[0].maxWriteBandwidthMbs"
                  label={t('Max write bandwidth (MB/s)')}
                  fieldId="tier-max-write-bandwidth"
                  type="number"
                  isRequired
                />
                <InputField
                  name="backends[0].quotaGib"
                  label={t('Quota (GiB)')}
                  fieldId="tier-quota"
                  type="number"
                  isRequired
                />
                <CheckboxField
                  name="backends[0].encryptionEnabled"
                  label={t('Encryption enabled')}
                  fieldId="tier-encryption-enabled"
                />
              </OsacForm>
            </StackItem>

            {qosChanged && (
              <StackItem>
                <Alert variant="info" isInline title={t('QoS settings changed')}>
                  {t(
                    'Bandwidth and quota changes take effect immediately for existing and new volumes. Changes to encryption or protocol require the associated StorageClass to be recreated before new volumes pick them up; existing volumes are unaffected.',
                  )}
                </Alert>
              </StackItem>
            )}

            {!!submitError && (
              <StackItem>
                <Alert variant="danger" title={t('Failed to update storage tier')} isInline>
                  {getErrorMessage(submitError)}
                </Alert>
              </StackItem>
            )}
            <StackItem>
              <ActionList>
                <ActionListGroup>
                  <ActionListItem>
                    <Button
                      variant="primary"
                      onClick={submitForm}
                      isDisabled={isSubmitting}
                      isLoading={isSubmitting}
                    >
                      {t('Save')}
                    </Button>
                  </ActionListItem>
                  <ActionListItem>
                    <Button
                      variant="link"
                      onClick={() => navigate(TIERS_LIST_PATH)}
                      isDisabled={isSubmitting}
                    >
                      {t('Cancel')}
                    </Button>
                  </ActionListItem>
                </ActionListGroup>
              </ActionList>
            </StackItem>
          </Stack>
        );
      }}
    </Formik>
  );
};

export default StorageTierEditPage;
