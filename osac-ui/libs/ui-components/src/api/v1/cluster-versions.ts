import { ClusterVersionState, ClusterVersions } from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';

type ClusterVersionsQueryOptions = {
  enabled?: boolean;
};

export const CLUSTER_VERSION_ACTIVE_LIST_FILTER = `(this.spec.state == ${ClusterVersionState.ACTIVE} || this.spec.state == ${ClusterVersionState.DEPRECATED}) && this.spec.enabled == true`;

// References both spec.state and spec.enabled so the public List RPC returns
// every version — including obsolete and disabled ones. The server injects
// per-field default predicates (active/deprecated + enabled) only for fields the
// caller's filter does not reference, so touching both fields defeats that hiding.
export const CLUSTER_VERSION_ALL_STATES_LIST_FILTER = `this.spec.state in [${ClusterVersionState.UNSPECIFIED}, ${ClusterVersionState.ACTIVE}, ${ClusterVersionState.DEPRECATED}, ${ClusterVersionState.OBSOLETE}] && this.spec.enabled in [true, false]`;

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
  return useApiQuery({
    queryKey: apiQueryKey('v1/cluster_versions', id ? [id] : undefined),
    queryFn: () => client.get({ id: id ?? '' }),
    select: (data) => data.object,
    enabled: Boolean(id),
  });
};
