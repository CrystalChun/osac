import { getInstanceTypeLifecycleErrorTitle } from './instanceTypeLifecycleErrorTitle';
import {
  type InstanceTypeLifecycleAction,
  useUpdateInstanceTypeState,
} from '../../api/v1/private/instance-type';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import { useToast } from '../Toast/useToast';

/** Runs an instance type lifecycle transition and surfaces a toast if it fails. */
export const useInstanceTypeLifecycleAction = () => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const updateState = useUpdateInstanceTypeState();

  const runLifecycleAction = (instanceTypeId: string, action: InstanceTypeLifecycleAction) => {
    updateState.mutate(
      { id: instanceTypeId, action },
      {
        onError: (error) => {
          addToast({
            variant: 'danger',
            title: getInstanceTypeLifecycleErrorTitle(t, action),
            description: getErrorMessage(error),
          });
        },
      },
    );
  };

  return { runLifecycleAction };
};
