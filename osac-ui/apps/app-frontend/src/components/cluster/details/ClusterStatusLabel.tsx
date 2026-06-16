import { ClusterState } from '@osac/types';
import { type StatusKind, StatusLabel } from '@osac/ui-components/StatusLabel';

interface ClusterStatusLabelProps {
  state?: ClusterState;
}

const CLUSTER_STATUS_MAP: Record<ClusterState, { status: StatusKind; text: string }> = {
  [ClusterState.UNSPECIFIED]: { status: 'unspecified', text: 'Unknown' },
  [ClusterState.PROGRESSING]: { status: 'progressing', text: 'Provisioning' },
  [ClusterState.READY]: { status: 'ready', text: 'Ready' },
  [ClusterState.FAILED]: { status: 'failed', text: 'Failed' },
};

export const ClusterStatusLabel = ({ state }: ClusterStatusLabelProps) => {
  const { status, text } =
    CLUSTER_STATUS_MAP[state ?? ClusterState.UNSPECIFIED] ??
    CLUSTER_STATUS_MAP[ClusterState.UNSPECIFIED];

  return <StatusLabel status={status} text={text} />;
};
