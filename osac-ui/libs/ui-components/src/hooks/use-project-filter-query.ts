import { type ComputeInstance } from '@osac/types';

import { useSession } from './use-session';
import { cel } from '../api/cel';

export const useProjectFilterQuery = () => {
  const { projects } = useSession();
  return projects.length
    ? cel<ComputeInstance>((filter) => filter.field('metadata.project').isIn(projects))
    : undefined;
};
