import { Alert } from '@patternfly/react-core';

import { useProjects } from '@osac/ui-components/api/v1/project';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import { getErrorMessage } from '@osac/ui-components/utils/error';

import { SelectField } from './SelectField';
import { getFullProjectPath, getProjectName } from '../Project/utils';

interface ProjectFieldProps {
  label?: string;
}

const ProjectField = ({ label }: ProjectFieldProps) => {
  const { t } = useTranslation();
  const { data: projects = [], isLoading, error } = useProjects();
  return (
    <>
      <SelectField
        fieldId="metadata.project"
        label={label || t('Project')}
        name="metadata.project"
        options={projects.map((p) => ({
          label: getProjectName(p, t),
          value: getFullProjectPath(p),
        }))}
        isRequired
        isLoading={isLoading}
        isDisabled={!!error}
      />
      {error && (
        <Alert variant="danger" title={t('Failed to fetch projects')}>
          {getErrorMessage(error)}
        </Alert>
      )}
    </>
  );
};

export default ProjectField;
