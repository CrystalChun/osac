import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import {
  storageBackendIdsFilter,
  usePrivateStorageBackends,
} from '../../api/v1/private/storage-backends';
import { usePrivateStorageTier } from '../../api/v1/private/storage-tiers';
import { ResourceDetailsPageError } from '../../components/Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../../components/Resource/ResourceDetailsPageLoading';
import { uniqueBackendIds } from '../../components/Storage/storageTierBackendResolution';
import { StorageTierDetails } from '../../components/Storage/StorageTierDetails';
import { useTranslation } from '../../hooks/useTranslation';

const TIERS_LIST_PATH = '/admin/infrastructure/storage/tiers';

export const StorageTierDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams() as { id: string };
  const { data: tier, isLoading, isError, error, refetch } = usePrivateStorageTier(id);

  const backendIds = useMemo(() => uniqueBackendIds(tier ? [tier] : []), [tier]);
  const { data: backends = [], error: backendsError } = usePrivateStorageBackends(
    { filter: storageBackendIdsFilter(backendIds) },
    { enabled: backendIds.length > 0 },
  );
  const backendsById = useMemo(
    () => new Map(backends.map((backend) => [backend.id, backend])),
    [backends],
  );

  if (isLoading) {
    return (
      <ResourceDetailsPageLoading
        parentTo={TIERS_LIST_PATH}
        parentLabel={t('Storage tiers')}
        cardCount={2}
      />
    );
  }

  if (isError) {
    return (
      <ResourceDetailsPageError
        parentTo={TIERS_LIST_PATH}
        parentLabel={t('Storage tiers')}
        resourceLabel={t('storage tier')}
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!tier) {
    return (
      <ResourceDetailsPageError
        parentTo={TIERS_LIST_PATH}
        parentLabel={t('Storage tiers')}
        resourceLabel={t('storage tier')}
        variant="not-found"
      />
    );
  }

  return (
    <StorageTierDetails tier={tier} backendsById={backendsById} backendsError={backendsError} />
  );
};
