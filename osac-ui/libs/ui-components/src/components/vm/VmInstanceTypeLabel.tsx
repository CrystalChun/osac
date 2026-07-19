import { Skeleton } from '@patternfly/react-core';

import type { InstanceType } from '@osac/types';

import { formatInstanceTypeDisplayName } from './utils';
import { useTranslation } from '../../hooks/useTranslation';

export interface VmInstanceTypeLabelProps {
  instanceType?: InstanceType;
  /** Fallback when `isLoading` is false but `instanceType` is unset (catalog lookup not found). */
  instanceTypeId?: string;
  isLoading?: boolean;
  /** Displayed when both `instanceType` and `instanceTypeId` are unset (e.g. "1 vCPU, 2 GiB"). */
  sizingFallback?: string;
}

export const VmInstanceTypeLabel = ({
  instanceTypeId,
  instanceType,
  isLoading = false,
  sizingFallback,
}: VmInstanceTypeLabelProps) => {
  const { t } = useTranslation();
  const trimmedId = instanceTypeId?.trim() ?? '';

  if (isLoading && trimmedId) {
    return <Skeleton width="150px" />;
  }

  const fallback = trimmedId || sizingFallback;
  return formatInstanceTypeDisplayName(instanceType, ` (${t('deprecated')})`, fallback);
};
