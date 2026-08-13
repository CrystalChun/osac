import type { TFunction } from 'i18next';

import type { StorageTier } from '@osac/types/private';
import { StorageProtocol } from '@osac/types/private';

export const protocolLabel = (t: TFunction, protocol: StorageProtocol): string => {
  switch (protocol) {
    case StorageProtocol.NFS:
      return t('NFS');
    case StorageProtocol.BLOCK:
      return t('Block');
    default:
      return '—';
  }
};

export const uniqueBackendIds = (tiers: StorageTier[]): string[] => {
  const ids = new Set<string>();
  tiers.forEach((tier) => {
    tier.spec?.backends.forEach((backend) => ids.add(backend.backendId));
  });
  return Array.from(ids).sort();
};
