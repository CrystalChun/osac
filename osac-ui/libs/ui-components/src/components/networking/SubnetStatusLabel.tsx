import { SubnetState } from '@osac/types';

import { ResourceStatusLabel, type StatusKind } from '../Resource/ResourceStatusLabel';

interface SubnetStatusLabelProps {
  state?: SubnetState;
}

const SUBNET_STATUS_MAP: Record<SubnetState, { status: StatusKind; text: string }> = {
  [SubnetState.UNSPECIFIED]: { status: 'unspecified', text: 'Unknown' },
  [SubnetState.PENDING]: { status: 'progressing', text: 'Provisioning' },
  [SubnetState.READY]: { status: 'ready', text: 'Ready' },
  [SubnetState.FAILED]: { status: 'failed', text: 'Failed' },
  [SubnetState.DELETING]: { status: 'progressing', text: 'Deleting' },
  [SubnetState.DELETE_FAILED]: { status: 'failed', text: 'Delete Failed' },
};

const resolveSubnetStatus = (state?: SubnetState): { status: StatusKind; text: string } => {
  switch (state) {
    case SubnetState.PENDING:
      return SUBNET_STATUS_MAP[SubnetState.PENDING];
    case SubnetState.READY:
      return SUBNET_STATUS_MAP[SubnetState.READY];
    case SubnetState.FAILED:
      return SUBNET_STATUS_MAP[SubnetState.FAILED];
    case SubnetState.DELETING:
      return SUBNET_STATUS_MAP[SubnetState.DELETING];
    case SubnetState.DELETE_FAILED:
      return SUBNET_STATUS_MAP[SubnetState.DELETE_FAILED];
    default:
      return SUBNET_STATUS_MAP[SubnetState.UNSPECIFIED];
  }
};

export const SubnetStatusLabel = ({ state }: SubnetStatusLabelProps) => {
  const { status, text } = resolveSubnetStatus(state);

  return <ResourceStatusLabel status={status} text={text} />;
};
