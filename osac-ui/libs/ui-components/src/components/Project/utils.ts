import { TFunction } from 'i18next';

import { Project } from '@osac/types';
import { escapeCelStringLiteral } from '@osac/ui-components/api/v1/networking';

export const getProjectName = (project: Project, t: TFunction): string => {
  if (project.metadata?.name === '') {
    return t('Default');
  }
  return project.spec?.title || project.metadata?.name || project.id;
};

export const getFullProjectPath = (project: Project | undefined) => {
  return project?.metadata?.project
    ? `${project.metadata.project}.${project.metadata?.name}`
    : project?.metadata?.name || '';
};

export const fullProjectPathToQueryFilter = (fullProjectPath: string) => {
  if (!fullProjectPath.includes('.')) {
    return `this.metadata.tenant != "shared" && this.metadata.name == "${escapeCelStringLiteral(fullProjectPath)}"`;
  }

  const lastIndex = fullProjectPath.lastIndexOf('.');

  const parent = fullProjectPath.slice(0, lastIndex);
  const name = fullProjectPath.slice(lastIndex + 1);

  return `this.metadata.tenant != "shared" && this.metadata.name == "${escapeCelStringLiteral(name)}" && this.metadata.project == "${escapeCelStringLiteral(parent)}"`;
};
