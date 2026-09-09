import type { TFunction } from 'i18next';

import { formatBootDiskSizeForReview, formatReviewScalar } from './catalogOverlay';

export interface StorageDiskValue {
  sizeGib?: unknown;
  storageTier?: unknown;
}

export const formatStorageTierForDisplay = (value: unknown): string => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const ref = value as { name?: string; id?: string };
    const name = ref.name?.trim() ?? '';
    const id = ref.id?.trim() ?? '';
    if (name && id) {
      return `${name} (${id})`;
    }
    return formatReviewScalar(name || id);
  }
  return formatReviewScalar(value);
};

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
      storageTier: formatStorageTierForDisplay(bootDisk?.storageTier),
    },
    ...(additionalDisks ?? []).map((disk, index) => ({
      name: t('Additional disk {{number}}', { number: index + 1 }),
      size: formatBootDiskSizeForReview(disk.sizeGib),
      storageTier: formatStorageTierForDisplay(disk.storageTier),
    })),
  ];
};
