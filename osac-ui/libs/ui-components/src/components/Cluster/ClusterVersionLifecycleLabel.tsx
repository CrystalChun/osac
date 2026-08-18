import { Tooltip } from '@patternfly/react-core';
import type { TFunction } from 'i18next';

import { type ClusterVersionDeprecation, ClusterVersionState } from '@osac/types';

import { useTranslation } from '../../hooks/useTranslation';
import {
  ResourceLifecycleLabel,
  ResourceLifecycleLabelProps,
} from '../Resource/ResourceLifecycleLabel';

export interface ClusterVersionLifecycleLabelProps {
  /** Lifecycle state from ClusterVersionSpec.state; undefined/unknown → UNSPECIFIED (grey, no tooltip). */
  state?: ClusterVersionState;
  /** Deprecation/obsolescence timestamps; drive the tooltip for DEPRECATED/OBSOLETE. */
  deprecation?: ClusterVersionDeprecation;
}

type ProtoTimestamp = { seconds?: bigint; nanos?: number };

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

const formatTimestamp = (value?: ProtoTimestamp): string | undefined => {
  if (!value || value.seconds === undefined) {
    return undefined;
  }
  const ms = Number(value.seconds) * 1000 + Math.floor((value.nanos ?? 0) / 1_000_000);
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? undefined : DATE_FORMAT.format(date);
};

const clusterVersionLifecycleMap = (
  t: TFunction,
): Record<ClusterVersionState, ResourceLifecycleLabelProps> => ({
  [ClusterVersionState.ACTIVE]: { lifecycle: 'active', text: t('Active') },
  [ClusterVersionState.DEPRECATED]: { lifecycle: 'deprecated', text: t('Deprecated') },
  [ClusterVersionState.OBSOLETE]: { lifecycle: 'obsolete', text: t('Obsolete') },
  [ClusterVersionState.UNSPECIFIED]: { lifecycle: 'unspecified', text: t('Unknown') },
});

const ClusterVersionLifecycleLabel = ({
  state,
  deprecation,
}: ClusterVersionLifecycleLabelProps) => {
  const { t } = useTranslation();

  const lifecycleMap = clusterVersionLifecycleMap(t);
  const props =
    state !== undefined
      ? (lifecycleMap[state] ?? lifecycleMap[ClusterVersionState.UNSPECIFIED])
      : lifecycleMap[ClusterVersionState.UNSPECIFIED];

  let tooltip: string | undefined;
  if (state === ClusterVersionState.DEPRECATED) {
    const date = formatTimestamp(deprecation?.deprecationTimestamp);
    if (date) {
      tooltip = t('Deprecated since {{date}}', { date });
    }
  } else if (state === ClusterVersionState.OBSOLETE) {
    const date = formatTimestamp(deprecation?.obsolescenceTimestamp);
    if (date) {
      tooltip = t('Obsolete since {{date}}', { date });
    }
  }

  const label = <ResourceLifecycleLabel {...props} />;
  return tooltip ? <Tooltip content={tooltip}>{label}</Tooltip> : label;
};

export default ClusterVersionLifecycleLabel;
