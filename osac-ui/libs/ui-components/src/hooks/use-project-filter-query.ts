import { useSession } from './use-session';
import { escapeCelStringLiteral } from '../api/v1/networking';

export const useProjectFilterQuery = () => {
  const { projects } = useSession();
  return projects.length
    ? `this.metadata.project in [${projects.map((p) => `"${escapeCelStringLiteral(p)}"`).join(',')}]`
    : undefined;
};
