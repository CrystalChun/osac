/**
 * flow: manage-virtual-machines
 * step: mvm_detail_view
 */
import { useParams } from 'react-router-dom';

import { useComputeInstance } from '../../api/v1/compute-instance';
import { ResourceDetailsPageError } from '../Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../Resource/ResourceDetailsPageLoading';
import { VmDetails } from './DetailsPage/VmDetails';

export const VmDetailsPage = () => {
  const { id } = useParams() as { id: string };
  const { data: vm, isLoading, isError, refetch } = useComputeInstance(id);

  if (isLoading) {
    return (
      <ResourceDetailsPageLoading
        parentTo="/vms"
        parentLabel="Virtual machines"
        tabLabels={['Overview', 'Networking']}
        tabsId="vm-detail-tabs"
        cardCount={2}
      />
    );
  }

  if (isError) {
    return (
      <ResourceDetailsPageError
        parentTo="/vms"
        parentLabel="Virtual machines"
        resourceLabel="virtual machine"
        variant="load-error"
        onRetry={() => void refetch()}
      />
    );
  }

  if (!vm) {
    return (
      <ResourceDetailsPageError
        parentTo="/vms"
        parentLabel="Virtual machines"
        resourceLabel="virtual machine"
        variant="not-found"
      />
    );
  }

  return <VmDetails vm={vm} />;
};
