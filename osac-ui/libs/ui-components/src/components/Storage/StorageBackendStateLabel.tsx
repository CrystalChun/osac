import type { TFunction } from 'i18next';

import { StorageBackendState } from '@osac/types/private';

import { useTranslation } from '../../hooks/useTranslation';
import { ResourceStatusLabel, StatusLabelProps } from '../Resource/ResourceStatusLabel';

interface StorageBackendStateLabelProps {
  state?: StorageBackendState;
}

const storageBackendStatusMap = (t: TFunction): Record<StorageBackendState, StatusLabelProps> => ({
  [StorageBackendState.READY]: {
    status: 'ready',
    text: t('Ready'),
  },
  [StorageBackendState.UNSPECIFIED]: {
    status: 'unspecified',
    text: t('Unspecified'),
  },
});

const StorageBackendStateLabel = ({ state }: StorageBackendStateLabelProps) => {
  const { t } = useTranslation();

  const statusMap = storageBackendStatusMap(t);

  const status =
    state !== undefined ? statusMap[state] : statusMap[StorageBackendState.UNSPECIFIED];

  return <ResourceStatusLabel {...status} />;
};

export default StorageBackendStateLabel;
