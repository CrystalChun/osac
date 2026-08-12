import { useNavigate } from 'react-router-dom';
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
  usePrivateStorageBackends,
} from '../../api/v1/private/storage-backends';
import { useCreateStorageTier } from '../../api/v1/private/storage-tiers';
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
import { SelectField } from '../Form/SelectField';

const TIERS_LIST_PATH = '/admin/infrastructure/storage/tiers';
const INT32_MAX = 2147483647;

const PROTOCOL_BY_VALUE: Record<'NFS' | 'BLOCK', StorageProtocol> = {
  NFS: StorageProtocol.NFS,
  BLOCK: StorageProtocol.BLOCK,
};

interface BackendAssociationValues {
  backendId: string;
  protocol: '' | 'NFS' | 'BLOCK';
  maxReadBandwidthMbs: string;
  maxWriteBandwidthMbs: string;
  quotaGib: string;
  encryptionEnabled: boolean;
}

interface StorageTierCreateFormValues {
  metadata: { name: string };
  description: string;
  backends: [BackendAssociationValues];
}

const initialValues: StorageTierCreateFormValues = {
  metadata: { name: '' },
  description: '',
  backends: [
    {
      backendId: '',
      protocol: '',
      maxReadBandwidthMbs: '',
      maxWriteBandwidthMbs: '',
      quotaGib: '',
      encryptionEnabled: false,
    },
  ],
};

const StorageTierCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync, error, isPending } = useCreateStorageTier();
  const { data: backends = [], isLoading: backendsLoading } = usePrivateStorageBackends({
    filter: STORAGE_BACKEND_READY_LIST_FILTER,
  });

  const backendOptions = backends.map((backend) => ({
    value: backend.id,
    label: backend.metadata?.name ?? backend.id,
  }));

  const schema = Yup.object({
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
            <BreadcrumbItem isActive>{t('Create')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('Create storage tier')}
          </Title>
        </Stack>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Formik
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={async (values) => {
            try {
              const backend = values.backends[0];
              await mutateAsync({
                metadata: values.metadata,
                spec: {
                  description: values.description,
                  backends: [
                    {
                      backendId: backend.backendId,
                      protocol: PROTOCOL_BY_VALUE[backend.protocol as 'NFS' | 'BLOCK'],
                      maxReadBandwidthMbs: Number(backend.maxReadBandwidthMbs),
                      maxWriteBandwidthMbs: Number(backend.maxWriteBandwidthMbs),
                      quotaGib: BigInt(Math.trunc(Number(backend.quotaGib))),
                      encryptionEnabled: backend.encryptionEnabled,
                    },
                  ],
                },
              });
              navigate(TIERS_LIST_PATH);
            } catch {
              // Surfaced via the mutation's own `error` state below; nothing further to do here.
            }
          }}
        >
          {({ submitForm, isSubmitting }) => (
            <Stack hasGutter>
              <LeaveFormConfirmation />
              <StackItem>
                <OsacForm>
                  <NameField />
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

              {!!error && (
                <StackItem>
                  <Alert variant="danger" title={t('Failed to create storage tier')} isInline>
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
                        isDisabled={isSubmitting || isPending}
                        isLoading={isSubmitting || isPending}
                      >
                        {t('Create')}
                      </Button>
                    </ActionListItem>
                    <ActionListItem>
                      <Button
                        variant="link"
                        onClick={() => navigate(TIERS_LIST_PATH)}
                        isDisabled={isSubmitting || isPending}
                      >
                        {t('Cancel')}
                      </Button>
                    </ActionListItem>
                  </ActionListGroup>
                </ActionList>
              </StackItem>
            </Stack>
          )}
        </Formik>
      </PageSection>
    </>
  );
};

export default StorageTierCreatePage;
