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

import { useCreateProject, useProjects } from '@osac/ui-components/api/v1/project';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import { getErrorMessage } from '@osac/ui-components/utils/error';

import { getCreateProjectPayload } from './payload';
import { getProjectValidationSchema } from './validation';
import { initialValues } from './values';
import NameField from '../../catalogProvision/wizard/fields/NameField';
import { InputField } from '../../Form/InputField';
import OsacForm from '../../Form/OsacForm';
import { SelectField } from '../../Form/SelectField';
import { getProjectName } from '../utils';

const ProjectCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync, error } = useCreateProject();
  const { data: projects = [] } = useProjects();

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/projects')}>
                {t('Projects')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('Create')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('Create project')}
          </Title>
        </Stack>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Formik
          initialValues={initialValues}
          validationSchema={getProjectValidationSchema(t)}
          onSubmit={async (values) => {
            try {
              await mutateAsync(getCreateProjectPayload(values));
              navigate('/projects');
            } catch {
              // tanstack handles the err
            }
          }}
        >
          {({ submitForm, isSubmitting }) => (
            <Stack hasGutter>
              <StackItem>
                <OsacForm>
                  <SelectField
                    fieldId="metadata.project"
                    label={t('Parent project')}
                    name="metadata.project"
                    options={projects.map((p) => ({
                      label: getProjectName(p, t),
                      value: p.metadata?.project
                        ? `${p.metadata.project}.${p.metadata.name}`
                        : p.metadata?.name || 'default',
                    }))}
                    isRequired
                  />
                  <NameField />
                  <InputField name="title" label={t('Title')} fieldId="project-title" />
                  <InputField
                    name="description"
                    label={t('Description')}
                    fieldId="project-description"
                  />
                </OsacForm>
              </StackItem>

              {!!error && (
                <StackItem>
                  <Alert variant="danger" title={t('Failed to create project')} isInline>
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
                        onClick={() => navigate('/projects')}
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

export default ProjectCreatePage;
