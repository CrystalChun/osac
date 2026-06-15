/**
 * flow: provider-administration
 * step: pad_infrastructure_topology
 */
import { PageSection } from '@patternfly/react-core';

import { useComputeInstances } from '@osac/ui-components/api/v1/compute-instance';
import { NetworkTopologyPage } from '@osac/ui-components/NetworkTopologyPage';

import { PageDataSection } from '../../components/layout/PageDataSection';
import { PageHeader } from '../../components/layout/PageHeader';

export const ProviderInfraTopologyPage = () => {
  const { data: vms = [] } = useComputeInstances();

  return (
    <PageSection isFilled className="osac-page">
      <PageHeader
        title="Infrastructure"
        description="Platform-wide network topology across all tenant organizations."
      />
      <PageDataSection>
        {/* Provider topology — VM node click is no-op per spec */}
        <NetworkTopologyPage vms={vms} />
      </PageDataSection>
    </PageSection>
  );
};
