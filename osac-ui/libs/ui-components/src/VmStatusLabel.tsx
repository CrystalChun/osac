import { Flex, FlexItem, Label, Spinner } from '@patternfly/react-core';

import { ComputeInstanceState } from '@osac/types';

import { type DisplayVmState, isTransitionDisplayState } from './vmDisplayState';

type VmStatusLabelProps = {
  state?: ComputeInstanceState | DisplayVmState;
};

type LabelColor = 'green' | 'orange' | 'red' | 'blue' | 'grey';

type LabelStyle = {
  color: LabelColor;
  text: string;
};

const ENUM_STATE_MAP: Partial<Record<ComputeInstanceState, LabelStyle>> = {
  [ComputeInstanceState.RUNNING]: { color: 'green', text: 'Running' },
  [ComputeInstanceState.STOPPED]: { color: 'orange', text: 'Stopped' },
  [ComputeInstanceState.PAUSED]: { color: 'orange', text: 'Paused' },
  [ComputeInstanceState.STARTING]: { color: 'blue', text: 'Starting' },
  [ComputeInstanceState.STOPPING]: { color: 'blue', text: 'Stopping' },
  [ComputeInstanceState.DELETING]: { color: 'red', text: 'Deleting' },
  [ComputeInstanceState.FAILED]: { color: 'red', text: 'Error' },
  [ComputeInstanceState.UNSPECIFIED]: { color: 'grey', text: 'Unknown' },
};

const STRING_STATE_MAP: Record<string, LabelStyle> = {
  COMPUTE_INSTANCE_STATE_RUNNING: { color: 'green', text: 'Running' },
  COMPUTE_INSTANCE_STATE_STOPPED: { color: 'orange', text: 'Stopped' },
  COMPUTE_INSTANCE_STATE_PAUSED: { color: 'orange', text: 'Paused' },
  COMPUTE_INSTANCE_STATE_STARTING: { color: 'blue', text: 'Starting' },
  COMPUTE_INSTANCE_STATE_STOPPING: { color: 'blue', text: 'Stopping' },
  COMPUTE_INSTANCE_STATE_DELETING: { color: 'red', text: 'Deleting' },
  COMPUTE_INSTANCE_STATE_FAILED: { color: 'red', text: 'Error' },
  COMPUTE_INSTANCE_STATE_UNSPECIFIED: { color: 'grey', text: 'Unknown' },
  restarting: { color: 'blue', text: 'Restarting' },
  starting: { color: 'blue', text: 'Starting' },
  stopping: { color: 'blue', text: 'Stopping' },
};

const resolveLabelStyle = (state?: ComputeInstanceState | DisplayVmState): LabelStyle => {
  if (state == null) {
    return { color: 'grey', text: 'Unknown' };
  }
  if (typeof state === 'number') {
    return ENUM_STATE_MAP[state] ?? { color: 'grey', text: 'Unknown' };
  }
  return STRING_STATE_MAP[state] ?? { color: 'grey', text: state };
};

const isTransitionState = (state?: ComputeInstanceState | DisplayVmState): boolean => {
  if (state == null) {
    return false;
  }
  if (typeof state === 'number') {
    return (
      state === ComputeInstanceState.STARTING ||
      state === ComputeInstanceState.STOPPING ||
      state === ComputeInstanceState.DELETING
    );
  }
  return isTransitionDisplayState(state);
};

export const VmStatusLabel = ({ state }: VmStatusLabelProps) => {
  const { color, text } = resolveLabelStyle(state);
  const inTransition = isTransitionState(state);

  return (
    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
      {inTransition ? (
        <FlexItem>
          <Spinner size="sm" aria-label={`${text} in progress`} />
        </FlexItem>
      ) : null}
      <FlexItem>
        <Label color={color} isCompact>
          {text}
        </Label>
      </FlexItem>
    </Flex>
  );
};
