import { type ClusterTemplate, ClusterTemplateSchema } from '@osac/types';

import { useApiQuery } from '../use-api-query';

export const useClusterTemplate = (id: string | undefined) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<ClusterTemplate>({
    queryKey: ['v1/cluster_templates', trimmedId ? [trimmedId] : null],
    meta: { decode: ClusterTemplateSchema },
    enabled: Boolean(trimmedId),
  });
};
