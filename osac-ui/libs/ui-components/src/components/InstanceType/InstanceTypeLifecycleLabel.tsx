import type { ComponentProps } from 'react';
import { Label } from '@patternfly/react-core';

import { InstanceTypeState } from '@osac/types/private';

import { useTranslation } from '../../hooks/useTranslation';

export interface InstanceTypeLifecycleLabelProps {
  state?: InstanceTypeState;
}

type LifecycleLabelConfig = {
  color: ComponentProps<typeof Label>['color'];
  text: string;
};

export const InstanceTypeLifecycleLabel = ({ state }: InstanceTypeLifecycleLabelProps) => {
  const { t } = useTranslation();

  const label = (): LifecycleLabelConfig => {
    switch (state) {
      case InstanceTypeState.ACTIVE:
        return { color: 'green', text: t('Active') };
      case InstanceTypeState.DEPRECATED:
        return { color: 'orange', text: t('Deprecated') };
      case InstanceTypeState.OBSOLETE:
        return { color: 'grey', text: t('Obsolete') };
      default:
        return { color: 'grey', text: t('Unspecified') };
    }
  };

  const { color, text } = label();

  return <Label color={color}>{text}</Label>;
};
