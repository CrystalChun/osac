import { Flex, FlexItem, Label, Spinner } from '@patternfly/react-core';

export type StatusKind = 'ready' | 'failed' | 'progressing' | 'unspecified';

type LabelColor = 'green' | 'red' | 'blue' | 'grey';

const STATUS_STYLE: Record<StatusKind, { color: LabelColor; spinning: boolean }> = {
  ready: { color: 'green', spinning: false },
  failed: { color: 'red', spinning: false },
  progressing: { color: 'blue', spinning: true },
  unspecified: { color: 'grey', spinning: false },
};

export interface StatusLabelProps {
  status: StatusKind;
  text: string;
}

export const StatusLabel = ({ status, text }: StatusLabelProps) => {
  const { color, spinning } = STATUS_STYLE[status];

  return (
    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
      {spinning ? (
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
