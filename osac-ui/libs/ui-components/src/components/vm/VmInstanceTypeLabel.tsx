import { Spinner } from '@patternfly/react-core';

import type { InstanceType } from '@osac/types';

import { formatInstanceTypeDisplayName, useInstanceType } from '../../api/v1/instance-types';
import { useTranslation } from '../../hooks/useTranslation';

export interface VmInstanceTypeLabelProps {
  instanceTypeId?: string;
  instanceType?: InstanceType;
  /** When set, uses preloaded mode and skips per-row fetch. */
  isLoading?: boolean;
}

export const VmInstanceTypeLabel = ({
  instanceTypeId,
  instanceType: preloadedInstanceType,
  isLoading: externalLoading,
}: VmInstanceTypeLabelProps) => {
  const { t } = useTranslation();
  const trimmedId = instanceTypeId?.trim() ?? '';
  const preloadedMode = externalLoading !== undefined;
  const { data: fetchedInstanceType, isLoading: fetchLoading } = useInstanceType(
    preloadedMode ? undefined : trimmedId || undefined,
  );

  const instanceType = preloadedMode ? preloadedInstanceType : fetchedInstanceType;
  const showSpinner = trimmedId
    ? preloadedMode
      ? externalLoading && !preloadedInstanceType
      : fetchLoading
    : false;

  const label = formatInstanceTypeDisplayName(
    instanceType,
    t('catalogProvision.instanceTypes.deprecatedSuffix'),
    instanceTypeId,
  );

  if (showSpinner) {
    return <Spinner size="sm" aria-label={t('vm.details.summary.loadingInstanceType')} />;
  }

  return label;
};
