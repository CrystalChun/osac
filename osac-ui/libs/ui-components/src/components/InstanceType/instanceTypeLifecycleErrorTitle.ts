import type { TFunction } from 'i18next';

import type { InstanceTypeLifecycleAction } from '../../api/v1/private/instance-type';

export const getInstanceTypeLifecycleErrorTitle = (
  t: TFunction,
  action: InstanceTypeLifecycleAction,
): string => {
  switch (action) {
    case 'deprecate':
      return t('Failed to deprecate instance type');
    case 'obsolete':
      return t('Failed to mark instance type as obsolete');
    case 'reactivate':
      return t('Failed to reactivate instance type');
  }
};
