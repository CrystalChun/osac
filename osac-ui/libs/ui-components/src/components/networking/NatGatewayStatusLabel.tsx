import { NATGatewayState } from '@osac/types';

import { ResourceStatusLabel, type StatusKind } from '../Resource/ResourceStatusLabel';

interface NatGatewayStatusLabelProps {
  state?: NATGatewayState;
}

const NAT_GATEWAY_STATUS_MAP: Record<NATGatewayState, { status: StatusKind; text: string }> = {
  [NATGatewayState.NAT_GATEWAY_STATE_UNSPECIFIED]: { status: 'unspecified', text: 'Unknown' },
  [NATGatewayState.NAT_GATEWAY_STATE_PENDING]: { status: 'progressing', text: 'Provisioning' },
  [NATGatewayState.NAT_GATEWAY_STATE_READY]: { status: 'ready', text: 'Ready' },
  [NATGatewayState.NAT_GATEWAY_STATE_FAILED]: { status: 'failed', text: 'Failed' },
  [NATGatewayState.NAT_GATEWAY_STATE_DELETING]: { status: 'progressing', text: 'Deleting' },
};

const resolveNatGatewayStatus = (state?: NATGatewayState): { status: StatusKind; text: string } =>
  state !== undefined && state in NAT_GATEWAY_STATUS_MAP
    ? NAT_GATEWAY_STATUS_MAP[state]
    : NAT_GATEWAY_STATUS_MAP[NATGatewayState.NAT_GATEWAY_STATE_UNSPECIFIED];

export const NatGatewayStatusLabel = ({ state }: NatGatewayStatusLabelProps) => {
  const { status, text } = resolveNatGatewayStatus(state);

  return <ResourceStatusLabel status={status} text={text} />;
};
