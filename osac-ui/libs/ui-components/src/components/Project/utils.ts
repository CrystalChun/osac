import { TFunction } from 'i18next';

import { Project } from '@osac/types';

export const getProjectName = (project: Project, t: TFunction): string => {
  if (project.metadata?.name === '') {
    return t('Default');
  }
  return project.spec?.title || project.metadata?.name || project.id;
};
