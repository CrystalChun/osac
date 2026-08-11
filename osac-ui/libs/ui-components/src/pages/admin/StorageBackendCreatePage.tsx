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
import { InputField } from '@osac/ui-components/components/Form/InputField';
import OsacForm from '@osac/ui-components/components/Form/OsacForm';
import {
  SelectField,
  type SelectFieldOption,
} from '@osac/ui-components/components/Form/SelectField';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import { getErrorMessage } from '@osac/ui-components/utils/error';
import { resourceNameSchema } from '@osac/ui-components/validation/resource-name';

const BACKENDS_LIST_PATH = '/admin/infrastructure/storage/backends';

const PROVIDERS = ['vast', 'ceph', 'pure'] as const;

interface StorageBackendFormValues {
  name: string;
  provider: string;
  endpoint: string;
  description: string;
  credentials: { username: string; password: string };
}

const initialValues: StorageBackendFormValues = {
  name: '',
  provider: '',
  endpoint: '',
  description: '',
  credentials: { username: '', password: '' },
};

const getStorageBackendSchema = (t: TFunction) =>
  Yup.object({
    name: resourceNameSchema(t),
    provider: Yup.string()
      .oneOf([...PROVIDERS], t('Provider must be one of vast, ceph, or pure'))
      .required(t('Provider is required')),
    endpoint: Yup.string().required(t('Endpoint is required')),
    description: Yup.string(),
    credentials: Yup.object({
      username: Yup.string().required(t('Username is required')),
      password: Yup.string().required(t('Password is required')),
    }),
  });

export const StorageBackendCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate, error, isPending } = useCreateStorageBackend();

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
          onSubmit={(values) =>
            mutate(
              {
                metadata: { name: values.name },
                spec: {
                  provider: values.provider,
                  endpoint: values.endpoint,
                  description: values.description,
                  credentials: {
                    username: values.credentials.username,
                    password: values.credentials.password,
                  },
                },
              },
              { onSuccess: () => navigate(BACKENDS_LIST_PATH) },
            )
          }
        >
          {({ submitForm }) => (
            <Stack hasGutter>
              <StackItem>
                <OsacForm>
                  <InputField
                    name="name"
                    label={t('Name')}
                    fieldId="storage-backend-name"
                    isRequired
                  />
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
                        isDisabled={isPending}
                        isLoading={isPending}
                      >
                        {t('Create')}
                      </Button>
                    </ActionListItem>
                    <ActionListItem>
                      <Button
                        variant="link"
                        onClick={() => navigate(BACKENDS_LIST_PATH)}
                        isDisabled={isPending}
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
