/**
 * flow: tenant-administration
 * step: tad_dashboard_home
 */
import { useNavigate } from 'react-router-dom'
import { Flex, Gallery, GalleryItem, PageSection, Title } from '@patternfly/react-core'
import { DEMO_TENANT_LABEL } from '@osac/api-contracts'
import { useSession } from '../../contexts/SessionContext'
import { useComputeInstances } from '../../api/hooks'
import { DashboardActionTile, DashboardMetricCard } from '../../components/dashboard'
import { PageHeader } from '../../components/layout'

const TILES = [
  {
    id: 'users',
    label: 'User management',
    icon: '👥',
    desc: 'Manage tenant users and access.',
    path: '/admin/users',
  },
  {
    id: 'quota',
    label: 'Quota control',
    icon: '📊',
    desc: 'View and adjust vCPU, memory, and storage quotas.',
    path: '/admin/quota',
  },
  {
    id: 'templates',
    label: 'Template catalog',
    icon: '📋',
    desc: 'Browse and manage VM templates.',
    path: '/admin/templates',
  },
  {
    id: 'networks',
    label: 'Networks',
    icon: '🔗',
    desc: 'Visualize virtual networks and VM topology.',
    path: '/admin/networks',
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: '💾',
    desc: 'Disk pools, snapshots, and backup policies.',
    path: '/admin/storage',
  },
]

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { selectedTenant } = useSession()
  const { data: vms = [] } = useComputeInstances()
  const tenantLabel = selectedTenant ? DEMO_TENANT_LABEL[selectedTenant] : 'Tenant'

  return (
    <PageSection>
      <PageHeader title="Dashboard" description={`Tenant administration for ${tenantLabel}`} />

      <Flex
        spaceItems={{ default: 'spaceItemsMd' }}
        flexWrap={{ default: 'wrap' }}
        style={{ marginBottom: 'var(--pf-t--global--spacer--xl)' }}
      >
        <DashboardMetricCard label="Total VMs" value={vms.length} />
        <DashboardMetricCard
          label="Running"
          value={vms.filter((v) => v.status.state === 'running').length}
        />
        <DashboardMetricCard label="Users" value={selectedTenant === 'northstar' ? 5 : 4} />
      </Flex>

      <Title
        headingLevel="h2"
        size="xl"
        style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}
      >
        Administration areas
      </Title>
      <Gallery hasGutter minWidths={{ default: '220px' }}>
        {TILES.map((tile) => (
          <GalleryItem key={tile.id}>
            <DashboardActionTile
              icon={tile.icon}
              title={tile.label}
              description={tile.desc}
              actionLabel={`Go to ${tile.label.toLowerCase()} →`}
              onAction={() => navigate(tile.path)}
            />
          </GalleryItem>
        ))}
      </Gallery>
    </PageSection>
  )
}
