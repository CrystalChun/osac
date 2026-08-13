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
import type { TFunction } from 'i18next';
import * as Yup from 'yup';

import type { StorageTier } from '@osac/types/private';
import { StorageProtocol } from '@osac/types/private';

import {
  STORAGE_BACKEND_READY_LIST_FILTER,
  usePrivateStorageBackend,
  usePrivateStorageBackends,
} from '../../api/v1/private/storage-backends';
import {
  useCreateStorageTier,
  usePrivateStorageTier,
  useUpdateStorageTier,
} from '../../api/v1/private/storage-tiers';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import { positiveIntegerSchema } from '../../validation/positive-integer';
import { resourceNameSchema } from '../../validation/resource-name';
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

interface StorageTierFormValues {
  metadata: { name: string };
  description: string;
  backends: [BackendAssociationValues];
}

const getInitialValues = (tier?: StorageTier): StorageTierFormValues => {
  const backend = tier?.spec?.backends[0];
  return {
    metadata: { name: tier?.metadata?.name ?? '' },
    description: tier?.spec?.description ?? '',
    backends: [
      {
        backendId: backend?.backendId ?? '',
        protocol: backend ? (VALUE_BY_PROTOCOL[backend.protocol] ?? '') : '',
        maxReadBandwidthMbs: backend ? String(backend.maxReadBandwidthMbs) : '',
        maxWriteBandwidthMbs: backend ? String(backend.maxWriteBandwidthMbs) : '',
        quotaGib: backend ? String(backend.quotaGib) : '',
        encryptionEnabled: backend?.encryptionEnabled ?? false,
      },
    ],
  };
};

const getStorageTierSchema = (t: TFunction) =>
  Yup.object({
    metadata: Yup.object({ name: resourceNameSchema(t) }),
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
  });

interface StorageTierFormProps {
  tier?: StorageTier;
  backendOptions: SelectFieldOption[];
  backendsLoading: boolean;
}

const StorageTierForm = ({ tier, backendOptions, backendsLoading }: StorageTierFormProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isEdit = !!tier;

  const { mutateAsync: create, error: createError } = useCreateStorageTier();
  const { mutateAsync: update, error: updateError } = useUpdateStorageTier();
  const error = isEdit ? updateError : createError;

  const initialValues = getInitialValues(tier);

  const onSubmit = async (values: StorageTierFormValues) => {
    try {
      const currentBackend = values.backends[0];
      const backendPayload = {
        backendId: currentBackend.backendId,
        protocol: PROTOCOL_BY_VALUE[currentBackend.protocol as 'NFS' | 'BLOCK'],
        maxReadBandwidthMbs: Number(currentBackend.maxReadBandwidthMbs),
        maxWriteBandwidthMbs: Number(currentBackend.maxWriteBandwidthMbs),
        quotaGib: BigInt(Math.trunc(Number(currentBackend.quotaGib))),
        encryptionEnabled: currentBackend.encryptionEnabled,
      };

      if (tier) {
        const descriptionChanged = values.description !== initialValues.description;
        const spec: { description?: string; backends: [Record<string, unknown>] } = {
          backends: [backendPayload],
        };
        if (descriptionChanged) {
          spec.description = values.description;
        }
        await update({ id: tier.id, metadata: { version: tier.metadata?.version ?? 0 }, spec });
      } else {
        await create({
          metadata: values.metadata,
          spec: { description: values.description, backends: [backendPayload] },
        });
      }
      navigate(TIERS_LIST_PATH);
    } catch {
      // Surfaced via the mutation's own `error` state below; nothing further to do here.
    }
  };

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
            <BreadcrumbItem isActive>{isEdit ? t('Edit') : t('Create')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {isEdit ? t('Edit storage tier') : t('Create storage tier')}
          </Title>
        </Stack>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Formik
          initialValues={initialValues}
          validationSchema={getStorageTierSchema(t)}
          onSubmit={onSubmit}
        >
          {({ values, submitForm, isSubmitting }) => {
            const qosChanged =
              isEdit &&
              QOS_FIELD_KEYS.some(
                (key) => values.backends[0][key] !== initialValues.backends[0][key],
              );

            return (
              <Stack hasGutter>
                <LeaveFormConfirmation />
                <StackItem>
                  <OsacForm>
                    <NameField isDisabled={isEdit} />
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

                {!!error && (
                  <StackItem>
                    <Alert
                      variant="danger"
                      title={
                        isEdit
                          ? t('Failed to update storage tier')
                          : t('Failed to create storage tier')
                      }
                      isInline
                    >
                      {getErrorMessage(error)}
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
                          {isEdit ? t('Save') : t('Create')}
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
      </PageSection>
    </>
  );
};

const StorageTierCreatePage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: tier, isLoading, error } = usePrivateStorageTier(id ?? '');

  const assignedBackendId = tier?.spec?.backends[0]?.backendId ?? '';
  const { data: readyBackends = [], isLoading: backendsLoading } = usePrivateStorageBackends({
    filter: STORAGE_BACKEND_READY_LIST_FILTER,
  });
  const { data: assignedBackend } = usePrivateStorageBackend(assignedBackendId);

  const backendOptions = readyBackends.map((backend) => ({
    value: backend.id,
    label: backend.metadata?.name ?? backend.id,
  }));
  if (assignedBackend && !backendOptions.some((option) => option.value === assignedBackend.id)) {
    backendOptions.push({
      value: assignedBackend.id,
      label: assignedBackend.metadata?.name ?? assignedBackend.id,
    });
  }

  if (id) {
    return (
      <ListPageBody isLoading={isLoading} error={error}>
        {tier && (
          <StorageTierForm
            tier={tier}
            backendOptions={backendOptions}
            backendsLoading={backendsLoading}
          />
        )}
      </ListPageBody>
    );
  }

  return <StorageTierForm backendOptions={backendOptions} backendsLoading={backendsLoading} />;
};

export default StorageTierCreatePage;
