/**
 * flow: provider-administration
 * step: pad_infrastructure_topology
 */
import { PageSection } from '@patternfly/react-core';
import { NetworkTopologyPage } from '@osac/ui-components/NetworkTopologyPage';
import { useComputeInstances } from '../../api/hooks';
import { PageHeader } from '../../components/layout/PageHeader';

export const ProviderInfraTopologyPage = () => {
  const { data: vms = [] } = useComputeInstances();

  return (
    <PageSection isFilled>
      <PageHeader
        title="Infrastructure"
        description="Platform-wide network topology across all tenant organizations."
      />
      {/* Provider topology — VM node click is no-op per spec */}
      <NetworkTopologyPage vms={vms} />
    </PageSection>
  );
};
