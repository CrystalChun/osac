import { useParams } from 'react-router-dom';

import { useComputeInstance } from '../../api/v1/compute-instance';
import { useTranslation } from '../../hooks/useTranslation';
import { ResourceDetailsPageError } from '../Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../Resource/ResourceDetailsPageLoading';
import VmDetails from './DetailsPage/VmDetails';

export const VmDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams() as { id: string };
  const { data: vm, isLoading, isError, error, refetch } = useComputeInstance(id);

  if (isLoading) {
    return (
      <ResourceDetailsPageLoading
        parentTo="/vms"
        parentLabel={t('vm.details.breadcrumb')}
        tabLabels={[t('Overview'), t('Networking')]}
        tabsId="vm-detail-tabs"
        cardCount={2}
      />
    );
  }

  if (isError) {
    return (
      <ResourceDetailsPageError
        parentTo="/vms"
        parentLabel={t('vm.details.breadcrumb')}
        resourceLabel="virtual machine"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!vm) {
    return (
      <ResourceDetailsPageError
        parentTo="/vms"
        parentLabel={t('vm.details.breadcrumb')}
        resourceLabel="virtual machine"
        variant="not-found"
      />
    );
  }

  return <VmDetails vm={vm} />;
};
