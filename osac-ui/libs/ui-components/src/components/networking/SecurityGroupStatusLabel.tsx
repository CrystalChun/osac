import { SecurityGroupState } from '@osac/types';

import { ResourceStatusLabel, type StatusKind } from '../Resource/ResourceStatusLabel';

interface SecurityGroupStatusLabelProps {
  state?: SecurityGroupState;
}

const SECURITY_GROUP_STATUS_MAP: Record<SecurityGroupState, { status: StatusKind; text: string }> =
  {
    [SecurityGroupState.UNSPECIFIED]: { status: 'unspecified', text: 'Unknown' },
    [SecurityGroupState.PENDING]: { status: 'progressing', text: 'Provisioning' },
    [SecurityGroupState.READY]: { status: 'ready', text: 'Ready' },
    [SecurityGroupState.FAILED]: { status: 'failed', text: 'Failed' },
    [SecurityGroupState.DELETING]: { status: 'progressing', text: 'Deleting' },
    [SecurityGroupState.DELETE_FAILED]: { status: 'failed', text: 'Delete Failed' },
  };

const resolveSecurityGroupStatus = (
  state?: SecurityGroupState,
): { status: StatusKind; text: string } => {
  switch (state) {
    case SecurityGroupState.PENDING:
      return SECURITY_GROUP_STATUS_MAP[SecurityGroupState.PENDING];
    case SecurityGroupState.READY:
      return SECURITY_GROUP_STATUS_MAP[SecurityGroupState.READY];
    case SecurityGroupState.FAILED:
      return SECURITY_GROUP_STATUS_MAP[SecurityGroupState.FAILED];
    case SecurityGroupState.DELETING:
      return SECURITY_GROUP_STATUS_MAP[SecurityGroupState.DELETING];
    case SecurityGroupState.DELETE_FAILED:
      return SECURITY_GROUP_STATUS_MAP[SecurityGroupState.DELETE_FAILED];
    default:
      return SECURITY_GROUP_STATUS_MAP[SecurityGroupState.UNSPECIFIED];
  }
};

export const SecurityGroupStatusLabel = ({ state }: SecurityGroupStatusLabelProps) => {
  const { status, text } = resolveSecurityGroupStatus(state);

  return <ResourceStatusLabel status={status} text={text} />;
};
