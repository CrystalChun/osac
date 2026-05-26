/**
 * flow: tenant-administration
 * step: tad_networks_topology
 */
import { PageSection } from '@patternfly/react-core'
import { DEMO_TENANT_LABEL } from '@osac/api-contracts'
import { NetworkTopologyPage } from '@osac/ui-components'
import { useSession } from '../../contexts/SessionContext'
import { useComputeInstances } from '../../api/hooks'
import { PageHeader } from '../../components/layout'

interface Props {
  onOpenVmDetail?: (vmId: string) => void
}

export function AdminNetworksPage({ onOpenVmDetail }: Props) {
  const { selectedTenant } = useSession()
  const { data: vms = [] } = useComputeInstances()
  const tenantLabel = selectedTenant ? DEMO_TENANT_LABEL[selectedTenant] : 'Tenant'

  return (
    <PageSection isFilled>
      <PageHeader
        title="Networks"
        description={`Network topology for ${tenantLabel}. Click a VM node to open its detail.`}
      />
      <NetworkTopologyPage vms={vms} onOpenVirtualMachineDetail={onOpenVmDetail} />
    </PageSection>
  )
}
