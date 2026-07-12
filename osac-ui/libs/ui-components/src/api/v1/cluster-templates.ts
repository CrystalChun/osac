import { type ClusterTemplate, ClusterTemplateSchema } from '@osac/types';

import { useApiQuery } from '../use-api-query';

export const useClusterTemplate = (id: string | undefined) =>
  useApiQuery<ClusterTemplate>({
    queryKey: ['v1/cluster_templates', id ? [id] : null],
    meta: { decode: ClusterTemplateSchema },
    enabled: Boolean(id),
  });
