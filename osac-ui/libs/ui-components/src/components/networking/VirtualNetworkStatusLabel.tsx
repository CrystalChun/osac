import { VirtualNetworkState } from '@osac/types';

import { ResourceStatusLabel, type StatusKind } from '../Resource/ResourceStatusLabel';

interface VirtualNetworkStatusLabelProps {
  state?: VirtualNetworkState;
}

const VIRTUAL_NETWORK_STATUS_MAP: Record<
  VirtualNetworkState,
  { status: StatusKind; text: string }
> = {
  [VirtualNetworkState.UNSPECIFIED]: { status: 'unspecified', text: 'Unknown' },
  [VirtualNetworkState.PENDING]: { status: 'progressing', text: 'Provisioning' },
  [VirtualNetworkState.READY]: { status: 'ready', text: 'Ready' },
  [VirtualNetworkState.FAILED]: { status: 'failed', text: 'Failed' },
};

const resolveVirtualNetworkStatus = (
  state?: VirtualNetworkState
): { status: StatusKind; text: string } => {
  switch (state) {
    case VirtualNetworkState.PENDING:
      return VIRTUAL_NETWORK_STATUS_MAP[VirtualNetworkState.PENDING];
    case VirtualNetworkState.READY:
      return VIRTUAL_NETWORK_STATUS_MAP[VirtualNetworkState.READY];
    case VirtualNetworkState.FAILED:
      return VIRTUAL_NETWORK_STATUS_MAP[VirtualNetworkState.FAILED];
    default:
      return VIRTUAL_NETWORK_STATUS_MAP[VirtualNetworkState.UNSPECIFIED];
  }
};

export const VirtualNetworkStatusLabel = ({ state }: VirtualNetworkStatusLabelProps) => {
  const { status, text } = resolveVirtualNetworkStatus(state);

  return <ResourceStatusLabel status={status} text={text} />;
};
