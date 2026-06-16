import { Label } from '@patternfly/react-core';
import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import InProgressIcon from '@patternfly/react-icons/dist/esm/icons/in-progress-icon';
import QuestionCircleIcon from '@patternfly/react-icons/dist/esm/icons/question-circle-icon';

export type StatusKind = 'ready' | 'failed' | 'progressing' | 'unspecified';

type LabelColor = 'green' | 'red' | 'blue' | 'grey';

type StatusStyle = {
  color: LabelColor;
  icon: typeof CheckCircleIcon;
  iconStatus: 'success' | 'danger' | 'info' | 'custom';
};

const STATUS_STYLE: Record<StatusKind, StatusStyle> = {
  ready: { color: 'green', icon: CheckCircleIcon, iconStatus: 'success' },
  failed: { color: 'red', icon: ExclamationCircleIcon, iconStatus: 'danger' },
  progressing: { color: 'blue', icon: InProgressIcon, iconStatus: 'info' },
  unspecified: { color: 'grey', icon: QuestionCircleIcon, iconStatus: 'custom' },
};

export interface StatusLabelProps {
  status: StatusKind;
  text: string;
}

export const StatusLabel = ({ status, text }: StatusLabelProps) => {
  const { color, icon: StatusIcon } = STATUS_STYLE[status];
  return (
    <Label color={color} icon={<StatusIcon aria-hidden />}>
      {text}
    </Label>
  );
};
