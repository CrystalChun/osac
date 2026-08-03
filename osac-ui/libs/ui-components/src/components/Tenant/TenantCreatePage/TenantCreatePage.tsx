import { useNavigate } from 'react-router-dom';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  FormSection,
  PageSection,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import MinusCircleIcon from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import PlusCircleIcon from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { FieldArray, Formik } from 'formik';

import BreakGlassCredentialModal from './BreakGlassCredentialModal';
import { getTenantSchema } from './validation';
import { tenantValues } from './values';
import { useCreateTenant } from '../../../api/v1/private/tenant';
import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/error';
import { InputField } from '../../Form/InputField';
import OsacForm from '../../Form/OsacForm';

export const TenantCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, mutate, error, isPending } = useCreateTenant();

  return (
    <>
      {data && <BreakGlassCredentialModal tenant={data} />}
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/admin/tenants')}>
                {t('Tenants')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('Create')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('Create tenant')}
          </Title>
        </Stack>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Formik
          initialValues={tenantValues}
          validationSchema={getTenantSchema(t)}
          onSubmit={(values) =>
            mutate({
              metadata: { name: values.name },
              spec: { domains: values.domains },
            })
          }
        >
          {({ values, submitForm }) => (
            <Stack hasGutter>
              <StackItem>
                <OsacForm>
                  <InputField name="name" label={t('Name')} fieldId="tenant-name" isRequired />
                  <FormSection title={t('Domains')}>
                    <FieldArray name="domains">
                      {(helpers) => (
                        <Stack hasGutter>
                          {values.domains.map((_domain, index) => (
                            <StackItem key={index}>
                              <InputField
                                name={`domains.${index}`}
                                label={t('Domain {{number}}', { number: index + 1 })}
                                fieldId={`tenant-domain-${index}`}
                                isRequired
                              >
                                <Button
                                  variant="plain"
                                  aria-label={t('Remove domain')}
                                  onClick={() => helpers.remove(index)}
                                  icon={<MinusCircleIcon />}
                                />
                              </InputField>
                            </StackItem>
                          ))}
                          <StackItem>
                            <Button
                              variant="link"
                              icon={<PlusCircleIcon />}
                              onClick={() => helpers.push('')}
                            >
                              {t('Add domain')}
                            </Button>
                          </StackItem>
                        </Stack>
                      )}
                    </FieldArray>
                  </FormSection>
                </OsacForm>
              </StackItem>

              {!!error && (
                <StackItem>
                  <Alert variant="danger" title={t('Failed to create tenant')} isInline>
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
                        onClick={() => navigate('/admin/tenants')}
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
