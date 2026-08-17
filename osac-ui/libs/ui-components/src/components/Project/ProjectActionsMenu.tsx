import { useState } from 'react';
import { Dropdown, DropdownItem, DropdownList, MenuToggle } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';

import type { Project } from '@osac/types';
import { useDeleteProject } from '@osac/ui-components/api/v1/project';

import { getProjectName } from './utils';
import { useTranslation } from '../../hooks/useTranslation';
import DeleteResourceModal from '../Resource/DeleteResourceModal';

interface ProjectActionsMenuProps {
  project: Project;
}

const ProjectActionsMenu = ({ project }: ProjectActionsMenuProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { mutateAsync: deleteProject } = useDeleteProject();

  return (
    <>
      {deleteOpen && (
        <DeleteResourceModal
          resourceName={getProjectName(project, t)}
          onDelete={() => deleteProject(project.id)}
          label={t('This permanently deletes the Project. This action cannot be undone.')}
          errorLabel={t('Failed to delete Project')}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => setDeleteOpen(false)}
        />
      )}
      <Dropdown
        isOpen={open}
        onOpenChange={setOpen}
        toggle={(ref) => (
          <MenuToggle
            ref={ref}
            variant="plain"
            onClick={() => setOpen((o) => !o)}
            aria-label={t('Actions for {{name}}', { name: getProjectName(project, t) })}
          >
            <EllipsisVIcon />
          </MenuToggle>
        )}
        popperProps={{ position: 'right' }}
      >
        <DropdownList>
          <DropdownItem
            value="delete"
            onClick={() => {
              setDeleteOpen(true);
              setOpen(false);
            }}
          >
            {t('Delete')}
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    </>
  );
};

export default ProjectActionsMenu;
