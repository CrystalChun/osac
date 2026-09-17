import type { TFunction } from 'i18next';

import type { ComputeInstancePowerAction } from '../../api/v1/compute-instance';

export const getPowerActionErrorTitle = (
  t: TFunction,
  action: ComputeInstancePowerAction,
): string => {
  switch (action) {
    case 'start':
      return t('Failed to start virtual machine');
    case 'stop':
      return t('Failed to stop virtual machine');
    case 'restart':
      return t('Failed to restart virtual machine');
  }
};

export const getPowerActionSuccessTitle = (
  t: TFunction,
  action: ComputeInstancePowerAction,
  name: string,
): string => {
  switch (action) {
    case 'start':
      return t('Start initiated for {{name}}', { name });
    case 'stop':
      return t('Stop initiated for {{name}}', { name });
    case 'restart':
      return t('Restart initiated for {{name}}', { name });
  }
};
