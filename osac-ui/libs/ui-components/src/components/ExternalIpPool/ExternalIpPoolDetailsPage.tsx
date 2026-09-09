import { useNavigate, useParams } from 'react-router-dom';

import { ExternalIPPools } from '@osac/types/private';

import ExternalIpPoolDetailsPageContent from './ExternalIpPoolDetailsPageContent';
import { useGetResource } from '../../api/use-resource';
import { useTranslation } from '../../hooks/useTranslation';
import ResourceDetailsPage from '../Resource/ResourceDetailsPage';

const POOLS_LIST_PATH = '/admin/infrastructure/external-ip-pools';

export const ExternalIpPoolDetailsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useGetResource(ExternalIPPools, { id });
  const pool = data?.object;

  return (
    <ResourceDetailsPage
      error={error}
      found={!!pool}
      isLoading={isLoading}
      parentLabel={t('External IP pools')}
      parentTo={POOLS_LIST_PATH}
      refetch={refetch}
      resourceLabel={t('external IP pool')}
      cardCount={3}
    >
      {pool && (
        <ExternalIpPoolDetailsPageContent pool={pool} onDeleted={() => navigate(POOLS_LIST_PATH)} />
      )}
    </ResourceDetailsPage>
  );
};
