import { Flex, FlexItem, Label, Spinner } from '@patternfly/react-core';

import { ComputeInstanceState } from '@osac/types';

type VmStatusLabelProps = {
  state?: ComputeInstanceState;
};

type LabelColor = 'green' | 'orange' | 'red' | 'blue' | 'grey';

type LabelStyle = {
  color: LabelColor;
  text: string;
};

const ENUM_STATE_MAP: Record<ComputeInstanceState, LabelStyle> = {
  [ComputeInstanceState.UNSPECIFIED]: { color: 'grey', text: 'Unknown' },
  [ComputeInstanceState.STARTING]: { color: 'blue', text: 'Starting' },
  [ComputeInstanceState.RUNNING]: { color: 'green', text: 'Running' },
  [ComputeInstanceState.FAILED]: { color: 'red', text: 'Error' },
  [ComputeInstanceState.DELETING]: { color: 'red', text: 'Deleting' },
  [ComputeInstanceState.STOPPING]: { color: 'blue', text: 'Stopping' },
  [ComputeInstanceState.STOPPED]: { color: 'orange', text: 'Stopped' },
  [ComputeInstanceState.PAUSED]: { color: 'orange', text: 'Paused' },
};

const isTransitionState = (state?: ComputeInstanceState): boolean => {
  return (
    state === ComputeInstanceState.STARTING ||
    state === ComputeInstanceState.STOPPING ||
    state === ComputeInstanceState.DELETING
  );
};

export const VmStatusLabel = ({ state }: VmStatusLabelProps) => {
  const fallback = ENUM_STATE_MAP[ComputeInstanceState.UNSPECIFIED];
  const style = state == null ? undefined : ENUM_STATE_MAP[state];
  const { color, text } = style ?? fallback;
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
