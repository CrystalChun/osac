import type { ComponentType, SVGProps } from 'react';
import PauseIcon from '@patternfly/react-icons/dist/esm/icons/pause-icon';

import { ComputeInstanceState } from '@osac/types';

import {
  type LabelColor,
  ResourceStatusLabel,
  type StatusKind,
} from './components/Resource/ResourceStatusLabel';
import { useTranslation } from './hooks/useTranslation';

type VmStatusLabelProps = {
  state?: ComputeInstanceState;
};

export type ResolvedVmStatus = {
  status: StatusKind;
  text: string;
  color?: LabelColor;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

export const resolveVmStatus = (
  state: ComputeInstanceState | undefined,
  t: (key: string) => string,
): ResolvedVmStatus => {
  switch (state) {
    case ComputeInstanceState.RUNNING:
      return { status: 'ready', text: t('Running') };
    case ComputeInstanceState.FAILED:
      return { status: 'failed', text: t('Failed') };
    case ComputeInstanceState.STARTING:
      return { status: 'progressing', text: t('Starting') };
    case ComputeInstanceState.STOPPING:
      return { status: 'progressing', text: t('Stopping') };
    case ComputeInstanceState.DELETING:
      return { status: 'progressing', text: t('Deleting') };
    case ComputeInstanceState.STOPPED:
      return { status: 'failed', text: t('Stopped') };
    case ComputeInstanceState.PAUSED:
      return {
        status: 'unspecified',
        text: t('Paused'),
        color: 'grey',
        icon: PauseIcon,
      };
    default:
      return { status: 'unspecified', text: t('Unknown') };
  }
};

export const VmStatusLabel = ({ state }: VmStatusLabelProps) => {
  const { t } = useTranslation();
  const { status, text, color, icon } = resolveVmStatus(state, t);
  return <ResourceStatusLabel status={status} text={text} color={color} icon={icon} />;
};
