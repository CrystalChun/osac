import { Flex, FlexItem, Label, Spinner } from '@patternfly/react-core';

import { type DisplayVmState, isTransitionDisplayState } from './vmDisplayState';

interface VmStatusLabelProps {
  state: DisplayVmState;
}

type LabelColor = 'green' | 'orange' | 'red' | 'blue' | 'grey';

type LabelStyle = {
  color: LabelColor;
  text: string;
};

const STATE_MAP: Record<string, LabelStyle> = {
  COMPUTE_INSTANCE_STATE_RUNNING: { color: 'green', text: 'Running' },
  COMPUTE_INSTANCE_STATE_STOPPED: { color: 'orange', text: 'Stopped' },
  COMPUTE_INSTANCE_STATE_STARTING: { color: 'blue', text: 'Starting' },
  COMPUTE_INSTANCE_STATE_STOPPING: { color: 'blue', text: 'Stopping' },
  COMPUTE_INSTANCE_STATE_DELETING: { color: 'red', text: 'Deleting' },
  COMPUTE_INSTANCE_STATE_FAILED: { color: 'red', text: 'Error' },
  COMPUTE_INSTANCE_STATE_UNSPECIFIED: { color: 'grey', text: 'Unknown' },
  restarting: { color: 'blue', text: 'Restarting' },
  starting: { color: 'blue', text: 'Starting' },
  stopping: { color: 'blue', text: 'Stopping' },
};

const resolveLabelStyle = (state: DisplayVmState): LabelStyle => {
  return STATE_MAP[state] ?? { color: 'grey', text: state };
};

export const VmStatusLabel = ({ state }: VmStatusLabelProps) => {
  const { color, text } = resolveLabelStyle(state);
  const inTransition = isTransitionDisplayState(state);

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
