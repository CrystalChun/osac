import { useComputeInstances } from '@osac/ui-components/api/v1/compute-instance';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { useSession } from '@osac/ui-components/hooks/use-session';
import { NetworkTopologyPage } from '@osac/ui-components/NetworkTopologyPage';

export const AdminNetworksPage = () => {
  const { username } = useSession();
  const { data: vms = [], isLoading, error } = useComputeInstances();
  const tenantLabel = username ?? 'your organization';

  return (
    <ListPage
      title="Networks"
      description={`Network topology for ${tenantLabel}. Click a VM node to open its detail.`}
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <NetworkTopologyPage vms={vms} />
      </ListPageBody>
    </ListPage>
  );
};
