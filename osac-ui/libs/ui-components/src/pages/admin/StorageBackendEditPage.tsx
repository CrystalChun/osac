import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Bullseye,
  Button,
  PageSection,
  Spinner,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { Formik } from 'formik';
import type { TFunction } from 'i18next';
import * as Yup from 'yup';

import type { StorageBackend } from '@osac/types/private';
import {
  usePrivateStorageBackend,
  useUpdateStorageBackend,
} from '@osac/ui-components/api/v1/private/storage-backends';
import NameField from '@osac/ui-components/components/catalogProvision/wizard/fields/NameField';
import { InputField } from '@osac/ui-components/components/Form/InputField';
import LeaveFormConfirmation from '@osac/ui-components/components/Form/LeaveFormConfirmation';
import OsacForm from '@osac/ui-components/components/Form/OsacForm';
import {
  SelectField,
  type SelectFieldOption,
} from '@osac/ui-components/components/Form/SelectField';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import { getErrorMessage } from '@osac/ui-components/utils/error';

const BACKENDS_LIST_PATH = '/admin/infrastructure/storage/backends';

interface StorageBackendEditFormValues {
  metadata: { name: string };
  provider: string;
  endpoint: string;
  description: string;
  credentials: { username: string; password: string };
}

const getStorageBackendEditSchema = (t: TFunction) => {
  const pairError = t('Enter both username and password, or leave both blank');
  return Yup.object({
    endpoint: Yup.string().required(t('Endpoint is required')),
    description: Yup.string(),
    credentials: Yup.object({
      username: Yup.string().test('credentials-pair', pairError, function (value) {
        const parent = this.parent as { username?: string; password?: string } | undefined;
        return !!value === !!parent?.password;
      }),
      password: Yup.string().test('credentials-pair', pairError, function (value) {
        const parent = this.parent as { username?: string; password?: string } | undefined;
        return !!value === !!parent?.username;
      }),
    }),
  });
};

const StorageBackendEditForm = ({ backend }: { backend: StorageBackend }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync, error } = useUpdateStorageBackend();

  const providerOptions: SelectFieldOption[] = [
    { value: 'vast', label: t('VAST') },
    { value: 'ceph', label: t('Ceph') },
    { value: 'pure', label: t('Pure') },
  ];

  const initialValues: StorageBackendEditFormValues = {
    metadata: { name: backend.metadata?.name ?? '' },
    provider: backend.spec?.provider ?? '',
    endpoint: backend.spec?.endpoint ?? '',
    description: backend.spec?.description ?? '',
    credentials: { username: '', password: '' },
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate(BACKENDS_LIST_PATH)}>
                {t('Storage backends')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('Edit')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('Edit storage backend')}
          </Title>
        </Stack>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Formik
          initialValues={initialValues}
          validationSchema={getStorageBackendEditSchema(t)}
          onSubmit={async (values) => {
            try {
              await mutateAsync({
                id: backend.id,
                version: backend.metadata?.version ?? 0,
                spec: {
                  endpoint: values.endpoint,
                  description: values.description,
                  ...(values.credentials.username && values.credentials.password
                    ? {
                        credentials: {
                          username: values.credentials.username,
                          password: values.credentials.password,
                        },
                      }
                    : {}),
                },
              });
              navigate(BACKENDS_LIST_PATH);
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
                  <NameField isDisabled />
                  <SelectField
                    name="provider"
                    label={t('Provider')}
                    fieldId="storage-backend-provider"
                    isRequired
                    isDisabled
                    options={providerOptions}
                  />
                  <InputField
                    name="endpoint"
                    label={t('Endpoint')}
                    fieldId="storage-backend-endpoint"
                    isRequired
                  />
                  <InputField
                    name="description"
                    label={t('Description')}
                    fieldId="storage-backend-description"
                  />
                  <InputField
                    name="credentials.username"
                    label={t('Username')}
                    fieldId="storage-backend-username"
                    helperText={t('Leave blank to keep the current credentials.')}
                  />
                  <InputField
                    name="credentials.password"
                    label={t('Password')}
                    fieldId="storage-backend-password"
                    type="password"
                  />
                </OsacForm>
              </StackItem>

              {!!error && (
                <StackItem>
                  <Alert variant="danger" title={t('Failed to update storage backend')} isInline>
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
                        {t('Save')}
                      </Button>
                    </ActionListItem>
                    <ActionListItem>
                      <Button
                        variant="link"
                        onClick={() => navigate(BACKENDS_LIST_PATH)}
                        isDisabled={isSubmitting}
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

export const StorageBackendEditPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = usePrivateStorageBackend(id ?? '');

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="danger" isInline title={t('Failed to fetch storage backend')}>
        {error ? getErrorMessage(error) : t('Storage backend not found')}
      </Alert>
    );
  }

  return <StorageBackendEditForm backend={data} />;
};
