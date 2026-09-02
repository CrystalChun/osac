import type { TFunction } from 'i18next';

import { DiskImageLifecycle } from '@osac/types';

import { useUpdateDiskImage } from '../../api/v1/disk-image';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import { useToast } from '../Toast/useToast';

export type DiskImageLifecycleAction = Exclude<DiskImageLifecycle, DiskImageLifecycle.UNSPECIFIED>;

export type DiskImageLifecycleActions = {
  canDeprecate: boolean;
  canObsolete: boolean;
  canReactivate: boolean;
  canDelete: boolean;
};

/** Determines which lifecycle transitions are valid from the disk image's current state. */
export const getDiskImageLifecycleActions = (
  state: DiskImageLifecycle | undefined,
): DiskImageLifecycleActions => {
  const resolvedState = state ?? DiskImageLifecycle.UNSPECIFIED;

  return {
    canDeprecate: resolvedState === DiskImageLifecycle.AVAILABLE,
    canObsolete:
      resolvedState === DiskImageLifecycle.AVAILABLE ||
      resolvedState === DiskImageLifecycle.DEPRECATED,
    canReactivate:
      resolvedState === DiskImageLifecycle.DEPRECATED ||
      resolvedState === DiskImageLifecycle.OBSOLETE,
    canDelete: resolvedState === DiskImageLifecycle.OBSOLETE,
  };
};

const getLifecycleErrorTitle = (t: TFunction, action: DiskImageLifecycleAction): string => {
  switch (action) {
    case DiskImageLifecycle.DEPRECATED:
      return t('Failed to deprecate disk image');
    case DiskImageLifecycle.OBSOLETE:
      return t('Failed to mark disk image as obsolete');
    case DiskImageLifecycle.AVAILABLE:
      return t('Failed to reactivate disk image');
  }
};

/** Runs a disk image lifecycle transition and surfaces a toast if it fails. */
export const useDiskImageLifecycleAction = () => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const updateDiskImage = useUpdateDiskImage();

  const runLifecycleAction = (diskImageId: string, action: DiskImageLifecycleAction) => {
    updateDiskImage.mutate(
      { id: diskImageId, body: { spec: { lifecycle: action } } },
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
