import { InstanceTypeState } from '@osac/types/private';

import { useTranslation } from '../../hooks/useTranslation';
import {
  ResourceLifecycleLabel,
  ResourceLifecycleLabelProps,
} from '../Resource/ResourceLifecycleLabel';

export interface InstanceTypeLifecycleLabelProps {
  state?: InstanceTypeState;
}

const InstanceTypeLifecycleLabel = ({ state }: InstanceTypeLifecycleLabelProps) => {
  const { t } = useTranslation();

  const props = (): ResourceLifecycleLabelProps => {
    switch (state) {
      case InstanceTypeState.ACTIVE:
        return { lifecycle: 'active', text: t('Active') };
      case InstanceTypeState.DEPRECATED:
        return { lifecycle: 'deprecated', text: t('Deprecated') };
      case InstanceTypeState.OBSOLETE:
        return { lifecycle: 'obsolete', text: t('Obsolete') };
      case InstanceTypeState.UNSPECIFIED:
      case undefined:
        return { lifecycle: 'unspecified', text: '—' };
      default:
        return { lifecycle: 'unspecified', text: String(state) };
    }
  };

  return <ResourceLifecycleLabel {...props()} />;
};

export default InstanceTypeLifecycleLabel;
