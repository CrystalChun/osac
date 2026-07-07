import { Skeleton } from '@patternfly/react-core';

import type { InstanceType } from '@osac/types';

import { formatInstanceTypeDisplayName } from '../../api/v1/instance-types';
import { useTranslation } from '../../hooks/useTranslation';

export interface VmInstanceTypeLabelProps {
  instanceType?: InstanceType;
  /** Fallback when `isLoading` is false but `instanceType` is unset (catalog lookup not found). */
  instanceTypeId?: string;
  isLoading?: boolean;
}

export const VmInstanceTypeLabel = ({
  instanceTypeId,
  instanceType,
  isLoading = false,
}: VmInstanceTypeLabelProps) => {
  const { t } = useTranslation();
  const trimmedId = instanceTypeId?.trim() ?? '';

  // Skeleton only when there is an id to resolve; otherwise show em dash immediately.
  if (isLoading && trimmedId) {
    return <Skeleton width="150px" />;
  }

  return formatInstanceTypeDisplayName(instanceType, ` (${t('deprecated')})`, instanceTypeId);
};
