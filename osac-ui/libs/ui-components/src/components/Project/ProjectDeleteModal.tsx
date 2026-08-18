import { Project } from '@osac/types';
import { useDeleteProject } from '@osac/ui-components/api/v1/project';

import { getProjectName } from './utils';
import { useTranslation } from '../../hooks/useTranslation';
import DeleteResourceModal from '../Resource/DeleteResourceModal';

const ProjectDeleteModal = ({
  project,
  onClose,
  onSuccess,
}: {
  project: Project;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
}) => {
  const { mutateAsync: deleteProject } = useDeleteProject();
  const { t } = useTranslation();
  return (
    <DeleteResourceModal
      resourceName={getProjectName(project, t)}
      onDelete={() => deleteProject(project.id)}
      label={t('This permanently deletes the Project. This action cannot be undone.')}
      errorLabel={t('Failed to delete Project')}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

export default ProjectDeleteModal;
