import type { TFunction } from 'i18next';

import { formatBootDiskSizeForReview, formatReviewScalar } from './catalogOverlay';

export interface StorageDiskValue {
  sizeGib?: unknown;
  storageTier?: string;
}

export interface VmStorageRow {
  name: string;
  size: string;
  storageTier: string;
}

export const getVmStorageRows = (
  t: TFunction,
  bootDisk: StorageDiskValue | undefined,
  additionalDisks: StorageDiskValue[] | undefined,
): VmStorageRow[] => {
  return [
    {
      name: t('Boot disk'),
      size: formatBootDiskSizeForReview(bootDisk?.sizeGib),
      storageTier: formatReviewScalar(bootDisk?.storageTier),
    },
    ...(additionalDisks ?? []).map((disk, index) => ({
      name: t('Additional disk {{number}}', { number: index + 1 }),
      size: formatBootDiskSizeForReview(disk.sizeGib),
      storageTier: formatReviewScalar(disk.storageTier),
    })),
  ];
};
