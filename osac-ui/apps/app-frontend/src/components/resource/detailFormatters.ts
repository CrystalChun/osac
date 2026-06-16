import { ClusterConditionType, ConditionStatus } from '@osac/types';

export const humanizeConditionType = (type: ClusterConditionType): string => {
  const name = ClusterConditionType[type];
  if (typeof name !== 'string') {
    return String(type);
  }
  return name.replace(/_/g, ' ');
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
