import type { TFunction } from 'i18next';

import { InstanceTypeState } from '@osac/types/private';

import { useUpdateInstanceType } from '../../api/v1/private/instance-type';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import { useToast } from '../Toast/useToast';

export type InstanceTypeLifecycleAction = Exclude<InstanceTypeState, InstanceTypeState.UNSPECIFIED>;

const getLifecycleErrorTitle = (t: TFunction, action: InstanceTypeLifecycleAction): string => {
  switch (action) {
    case InstanceTypeState.DEPRECATED:
      return t('Failed to deprecate instance type');
    case InstanceTypeState.OBSOLETE:
      return t('Failed to mark instance type as obsolete');
    case InstanceTypeState.ACTIVE:
      return t('Failed to reactivate instance type');
  }
};

/** Runs an instance type lifecycle transition and surfaces a toast if it fails. */
export const useInstanceTypeLifecycleAction = () => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const updateInstanceType = useUpdateInstanceType();

  const runLifecycleAction = (instanceTypeId: string, action: InstanceTypeLifecycleAction) => {
    updateInstanceType.mutate(
      { id: instanceTypeId, body: { spec: { state: action } } },
      {
        onError: (error) => {
          addToast({
            variant: 'danger',
            title: getLifecycleErrorTitle(t, action),
            description: getErrorMessage(error),
          });
        },
      },
    );
  };

  return { runLifecycleAction };
};
