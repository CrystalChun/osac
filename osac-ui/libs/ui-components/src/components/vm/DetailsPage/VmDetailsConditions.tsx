import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Label,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';

import type { ComputeInstance } from '@osac/types';
import {
  type ComputeInstanceCondition,
  ComputeInstanceConditionType,
  ConditionStatus,
} from '@osac/types';

import { SubtleContent } from '../../SubtleContent/SubtleContent';

import './VmDetailsConditions.css';

type ProtobufTimestamp = NonNullable<ComputeInstanceCondition['lastTransitionTime']>;

const formatTimestamp = (timestamp?: ProtobufTimestamp): string => {
  if (!timestamp?.seconds) {
    return '—';
  }
  const ms = Number(timestamp.seconds) * 1000 + Math.floor((timestamp.nanos ?? 0) / 1_000_000);
  return new Date(ms).toLocaleString();
};

const humanizeConditionType = (type: ComputeInstanceConditionType): string => {
  const label = ComputeInstanceConditionType[type];
  if (!label) {
    return 'Unknown';
  }
  return label.replace(/^COMPUTE_INSTANCE_CONDITION_TYPE_/, '').replace(/_/g, ' ');
};

const formatConditionStatus = (status: ConditionStatus): string => {
  switch (status) {
    case ConditionStatus.TRUE:
      return 'True';
    case ConditionStatus.FALSE:
      return 'False';
    default:
      return 'Unknown';
  }
};

const conditionStatusLabelColor = (
  status: ConditionStatus,
): 'green' | 'orange' | 'red' | 'blue' | 'grey' => {
  if (status === ConditionStatus.TRUE) {
    return 'green';
  }
  if (status === ConditionStatus.FALSE) {
    return 'red';
  }
  return 'grey';
};

const conditionDescription = (condition: ComputeInstanceCondition) => {
  if (condition.message) {
    return condition.message;
  }
  if (condition.reason) {
    return condition.reason;
  }
  return `Status is ${formatConditionStatus(condition.status).toLowerCase()}.`;
};

const parseConditionTime = (condition: ComputeInstanceCondition) => {
  const timestamp = condition.lastTransitionTime;
  if (!timestamp?.seconds) {
    return Number.NEGATIVE_INFINITY;
  }
  return Number(timestamp.seconds) * 1000 + Math.floor((timestamp.nanos ?? 0) / 1_000_000);
};

interface VmDetailsConditionsProps {
  vm: ComputeInstance;
}

export const VmDetailsConditions = ({ vm }: VmDetailsConditionsProps) => {
  const conditions = [...(vm.status?.conditions ?? [])].sort(
    (a, b) => parseConditionTime(b) - parseConditionTime(a),
  );

  return (
    <Card isFullHeight>
      <CardHeader>
        <CardTitle>Conditions</CardTitle>
      </CardHeader>
      <CardBody className="osac-vm-details-conditions-card__body">
        {conditions.length > 0 ? (
          <Stack hasGutter className="osac-vm-details-conditions-list">
            {conditions.map((condition, index) => {
              const title = humanizeConditionType(condition.type);
              const timestamp = formatTimestamp(condition.lastTransitionTime);
              const description = conditionDescription(condition);

              return (
                <StackItem key={`${String(condition.type)}-${index}`}>
                  <article className="osac-vm-details-condition">
                    <SubtleContent component="small">
                      <time dateTime={timestamp}>{timestamp}</time>
                    </SubtleContent>
                    <Flex
                      alignItems={{ default: 'alignItemsCenter' }}
                      spaceItems={{ default: 'spaceItemsSm' }}
                      flexWrap={{ default: 'wrap' }}
                    >
                      <FlexItem>
                        <Title headingLevel="h3" size="md">
                          {title}
                        </Title>
                      </FlexItem>
                      <FlexItem>
                        <Label color={conditionStatusLabelColor(condition.status)} isCompact>
                          {formatConditionStatus(condition.status)}
                        </Label>
                      </FlexItem>
                    </Flex>
                    <Content component="p">{description}</Content>
                  </article>
                </StackItem>
              );
            })}
          </Stack>
        ) : (
          <SubtleContent component="p">No conditions reported.</SubtleContent>
        )}
      </CardBody>
    </Card>
  );
};
