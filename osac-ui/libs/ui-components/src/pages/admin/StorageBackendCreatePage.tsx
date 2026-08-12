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
import type { TFunction } from 'i18next';
import * as Yup from 'yup';

import { useCreateStorageBackend } from '@osac/ui-components/api/v1/private/storage-backends';
import NameField from '@osac/ui-components/components/catalogProvision/wizard/fields/NameField';
import { CheckboxField } from '@osac/ui-components/components/Form/CheckboxField';
import { InputField } from '@osac/ui-components/components/Form/InputField';
import LeaveFormConfirmation from '@osac/ui-components/components/Form/LeaveFormConfirmation';
import OsacForm from '@osac/ui-components/components/Form/OsacForm';
import {
  SelectField,
  type SelectFieldOption,
} from '@osac/ui-components/components/Form/SelectField';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import { getErrorMessage } from '@osac/ui-components/utils/error';
import { resourceNameSchema } from '@osac/ui-components/validation/resource-name';

const BACKENDS_LIST_PATH = '/admin/infrastructure/storage/backends';

interface StorageBackendFormValues {
  metadata: { name: string };
  provider: string;
  endpoint: string;
  description: string;
  useCredentials: boolean;
  credentials: { username: string; password: string };
}

const initialValues: StorageBackendFormValues = {
  metadata: { name: '' },
  provider: '',
  endpoint: '',
  description: '',
  useCredentials: true,
  credentials: { username: '', password: '' },
};

const getStorageBackendSchema = (t: TFunction) =>
  Yup.object({
    metadata: Yup.object({ name: resourceNameSchema(t) }),
    provider: Yup.string().required(t('Provider is required')),
    endpoint: Yup.string().required(t('Endpoint is required')),
    description: Yup.string(),
    useCredentials: Yup.boolean(),
    // Credentials are optional on the backend. When "Use credentials" is checked,
    // both username and password are required; when unchecked they are omitted
    // from the request entirely (see onSubmit), so there is no "only one set" state.
    credentials: Yup.object().when('useCredentials', {
      is: true,
      then: (schema) =>
        schema.shape({
          username: Yup.string().required(t('Username is required')),
          password: Yup.string().required(t('Password is required')),
        }),
      otherwise: (schema) =>
        schema.shape({
          username: Yup.string(),
          password: Yup.string(),
        }),
    }),
  });

export const StorageBackendCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync, error } = useCreateStorageBackend();

  const providerOptions: SelectFieldOption[] = [
    { value: 'vast', label: t('VAST') },
    { value: 'ceph', label: t('Ceph') },
    { value: 'pure', label: t('Pure') },
  ];

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
            <BreadcrumbItem isActive>{t('Create')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('Create storage backend')}
          </Title>
        </Stack>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Formik
          initialValues={initialValues}
          validationSchema={getStorageBackendSchema(t)}
          onSubmit={async (values) => {
            try {
              await mutateAsync({
                metadata: values.metadata,
                spec: {
                  provider: values.provider,
                  endpoint: values.endpoint,
                  description: values.description,
                  // Omit credentials entirely when the user opts out — the backend
                  // does not require them, and a partial credentials object is never
                  // sent (username/password are all-or-nothing via the checkbox).
                  ...(values.useCredentials && {
                    credentials: {
                      username: values.credentials.username,
                      password: values.credentials.password,
                    },
                  }),
                },
              });
              navigate(BACKENDS_LIST_PATH);
            } catch {
              // Surfaced via the mutation's own `error` state below; nothing further to do here.
            }
          }}
        >
          {({ submitForm, isSubmitting, values }) => (
            <Stack hasGutter>
              <LeaveFormConfirmation />
              <StackItem>
                <OsacForm>
                  <NameField />
                  <SelectField
                    name="provider"
                    label={t('Provider')}
                    fieldId="storage-backend-provider"
                    isRequired
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
                  <CheckboxField
                    name="useCredentials"
                    label={t('Use credentials')}
                    fieldId="storage-backend-use-credentials"
                  />
                  {values.useCredentials && (
                    <>
                      <InputField
                        name="credentials.username"
                        label={t('Username')}
                        fieldId="storage-backend-username"
                        isRequired
                      />
                      <InputField
                        name="credentials.password"
                        label={t('Password')}
                        fieldId="storage-backend-password"
                        type="password"
                        isRequired
                      />
                    </>
                  )}
                </OsacForm>
              </StackItem>

              {!!error && (
                <StackItem>
                  <Alert variant="danger" title={t('Failed to create storage backend')} isInline>
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
                        {t('Create')}
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
