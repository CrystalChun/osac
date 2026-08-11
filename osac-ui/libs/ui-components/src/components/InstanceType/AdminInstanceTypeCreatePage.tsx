import { useNavigate } from 'react-router-dom';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Alert,
  AlertActionCloseButton,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  PageSection,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { Formik } from 'formik';

import { getInstanceTypeCreateSchema } from './CreatePage/validation';
import { instanceTypeCreateValues } from './CreatePage/values';
import { useCreateInstanceType } from '../../api/v1/private/instance-type';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import NameField from '../catalogProvision/wizard/fields/NameField';
import { InputField } from '../Form/InputField';
import OsacForm from '../Form/OsacForm';

const INSTANCE_TYPES_LIST_ROUTE = '/admin/infrastructure/instance-types';

const AdminInstanceTypeCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate, error, isPending, reset } = useCreateInstanceType();

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate(INSTANCE_TYPES_LIST_ROUTE)}>
                {t('Instance types')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('Create')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('Create instance type')}
          </Title>
        </Stack>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Formik
          initialValues={instanceTypeCreateValues}
          validationSchema={getInstanceTypeCreateSchema(t)}
          onSubmit={(values) => {
            mutate(
              {
                metadata: { name: values.metadata.name },
                spec: {
                  description: values.spec.description,
                  cores: Number(values.spec.cores),
                  memoryGib: Number(values.spec.memoryGib),
                },
              },
              { onSuccess: () => navigate(INSTANCE_TYPES_LIST_ROUTE) },
            );
          }}
        >
          {({ submitForm }) => (
            <Stack hasGutter>
              <StackItem>
                <OsacForm>
                  <NameField />
                  <InputField
                    name="spec.description"
                    label={t('Description')}
                    fieldId="instance-type-description"
                    multiline
                  />
                  <InputField
                    name="spec.cores"
                    label={t('CPU cores')}
                    fieldId="instance-type-cores"
                    type="number"
                    isRequired
                  />
                  <InputField
                    name="spec.memoryGib"
                    label={t('Memory (GiB)')}
                    fieldId="instance-type-memory-gib"
                    type="number"
                    isRequired
                  />
                </OsacForm>
              </StackItem>
              {!!error && (
                <StackItem>
                  <Alert
                    variant="danger"
                    title={t('Failed to create instance type')}
                    isInline
                    actionClose={<AlertActionCloseButton onClose={() => reset()} />}
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
                        isDisabled={isPending}
                        isLoading={isPending}
                      >
                        {t('Create')}
                      </Button>
                    </ActionListItem>
                    <ActionListItem>
                      <Button
                        variant="link"
                        onClick={() => navigate(INSTANCE_TYPES_LIST_ROUTE)}
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

export default AdminInstanceTypeCreatePage;
