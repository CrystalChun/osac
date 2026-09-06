import { useMemo } from 'react';

import type { ComputeInstance } from '@osac/types';

import { useStorageTiers } from '../../../api/v1/storage-tiers';
import { useTranslation } from '../../../hooks/useTranslation';
import { getVmStorageRows } from '../../catalogProvision/wizard/storageRows';

export const useVmStorageDisplay = (vm: ComputeInstance) => {
  const { t } = useTranslation();
  const { data: storageTiers = [] } = useStorageTiers();

  const storageRows = useMemo(
    () => getVmStorageRows(t, vm.spec?.bootDisk, vm.spec?.additionalDisks, storageTiers),
    [t, vm.spec?.bootDisk, vm.spec?.additionalDisks, storageTiers],
  );

  return { storageRows };
};
