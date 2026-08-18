import { ClusterVersionState, ClusterVersions } from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';

type ClusterVersionsQueryOptions = {
  enabled?: boolean;
};

export const CLUSTER_VERSION_ACTIVE_LIST_FILTER = `(this.spec.state == ${ClusterVersionState.ACTIVE} || this.spec.state == ${ClusterVersionState.DEPRECATED}) && this.spec.enabled == true`;

export const useClusterVersions = (
  params: ListParams = {},
  options: ClusterVersionsQueryOptions = {},
) => {
  const client = useApiFetch(ClusterVersions);
  return useApiQuery({
    queryKey: apiQueryKey('v1/cluster_versions', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled: options.enabled ?? true,
  });
};

export const useClusterVersion = (id: string | undefined) => {
  const client = useApiFetch(ClusterVersions);
  const trimmedId = id?.trim() ?? '';
  return useApiQuery({
    queryKey: apiQueryKey('v1/cluster_versions', trimmedId ? [trimmedId] : undefined),
    queryFn: () => client.get({ id: trimmedId }),
    select: (data) => data.object,
    enabled: Boolean(trimmedId),
  });
};
