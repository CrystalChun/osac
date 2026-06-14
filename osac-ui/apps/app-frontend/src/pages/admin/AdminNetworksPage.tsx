/**
 * flow: tenant-administration
 * step: tad_networks_topology
 */
import { PageSection } from '@patternfly/react-core';
import { NetworkTopologyPage } from '@osac/ui-components/NetworkTopologyPage';
import { useSession } from '../../contexts/SessionContext';
import { useComputeInstances } from '../../api/hooks';
import { PageHeader } from '../../components/layout/PageHeader';
import { PageDataSection } from '../../components/layout/PageDataSection';

interface Props {
  onOpenVmDetail?: (vmId: string) => void;
}

export const AdminNetworksPage = ({ onOpenVmDetail }: Props) => {
  const { username } = useSession();
  const { data: vms = [] } = useComputeInstances();
  const tenantLabel = username ?? 'your organization';

  return (
    <PageSection isFilled className="osac-page">
      <PageHeader
        title="Networks"
        description={`Network topology for ${tenantLabel}. Click a VM node to open its detail.`}
      />
      <PageDataSection>
        <NetworkTopologyPage vms={vms} onOpenVirtualMachineDetail={onOpenVmDetail} />
      </PageDataSection>
    </PageSection>
  );
};
