import { ClusterConditionType, ComputeInstanceConditionType, ConditionStatus } from '@osac/types';

export type ConditionResourceKind = 'cluster' | 'compute_instance';

export const humanizeConditionType = (
  type: ClusterConditionType | ComputeInstanceConditionType,
  resourceKind: ConditionResourceKind,
): string => {
  if (resourceKind === 'cluster') {
    const clusterName = ClusterConditionType[type as ClusterConditionType];
    if (typeof clusterName === 'string') {
      return clusterName.replace(/_/g, ' ');
    }
  } else {
    const vmName = ComputeInstanceConditionType[type as ComputeInstanceConditionType];
    if (typeof vmName === 'string') {
      return vmName.replace(/^COMPUTE_INSTANCE_CONDITION_TYPE_/, '').replace(/_/g, ' ');
    }
  }
  return String(type);
};

export const formatConditionStatusForDisplay = (status: ConditionStatus): string => {
  switch (status) {
    case ConditionStatus.TRUE:
      return 'True';
    case ConditionStatus.FALSE:
      return 'False';
    default:
      return 'Unknown';
  }
};

export const formatIsoDate = (iso?: string): string => {
  if (!iso?.trim()) {
    return '—';
  }
  const t = Date.parse(iso.trim());
  return Number.isNaN(t) ? iso : new Date(t).toLocaleString();
};

export const displayValue = (value?: string): string => value?.trim() || '—';
