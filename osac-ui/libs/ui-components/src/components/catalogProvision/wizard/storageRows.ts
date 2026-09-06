import type { TFunction } from 'i18next';

import {
  formatBootDiskSizeForReview,
  getStorageTierDisplayNameMap,
  resolveStorageTierDisplayNameFromMap,
} from './catalogOverlay';

export interface StorageDiskValue {
  sizeGib?: unknown;
  storageTier?: string;
}

interface StorageTierNameLookup {
  metadata?: { name?: string; displayName?: string };
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
  storageTiers: StorageTierNameLookup[] | undefined,
): VmStorageRow[] => {
  const tierDisplayNames = getStorageTierDisplayNameMap(storageTiers);

  return [
    {
      name: t('Boot disk'),
      size: formatBootDiskSizeForReview(bootDisk?.sizeGib),
      storageTier: resolveStorageTierDisplayNameFromMap(bootDisk?.storageTier, tierDisplayNames),
    },
    ...(additionalDisks ?? []).map((disk, index) => ({
      name: t('Additional disk {{number}}', { number: index + 1 }),
      size: formatBootDiskSizeForReview(disk.sizeGib),
      storageTier: resolveStorageTierDisplayNameFromMap(disk.storageTier, tierDisplayNames),
    })),
  ];
};
