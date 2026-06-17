import { ClusterState } from '@osac/types';

import { ResourceStatusLabel, type StatusKind } from '../Resource/ResourceStatusLabel';

interface ClusterStatusLabelProps {
  state?: ClusterState;
}

const CLUSTER_STATUS_MAP: Record<ClusterState, { status: StatusKind; text: string }> = {
  [ClusterState.UNSPECIFIED]: { status: 'unspecified', text: 'Unknown' },
  [ClusterState.PROGRESSING]: { status: 'progressing', text: 'Provisioning' },
  [ClusterState.READY]: { status: 'ready', text: 'Ready' },
  [ClusterState.FAILED]: { status: 'failed', text: 'Failed' },
};

const resolveClusterStatus = (state?: ClusterState): { status: StatusKind; text: string } => {
  switch (state) {
    case ClusterState.PROGRESSING:
      return CLUSTER_STATUS_MAP[ClusterState.PROGRESSING];
    case ClusterState.READY:
      return CLUSTER_STATUS_MAP[ClusterState.READY];
    case ClusterState.FAILED:
      return CLUSTER_STATUS_MAP[ClusterState.FAILED];
    default:
      return CLUSTER_STATUS_MAP[ClusterState.UNSPECIFIED];
  }
};

export const ClusterStatusLabel = ({ state }: ClusterStatusLabelProps) => {
  const { status, text } = resolveClusterStatus(state);

  return <ResourceStatusLabel status={status} text={text} />;
};
