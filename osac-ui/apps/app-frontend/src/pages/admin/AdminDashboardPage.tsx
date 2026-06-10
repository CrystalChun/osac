/**
 * flow: tenant-administration
 * step: tad_dashboard_home
 */
import { useNavigate } from 'react-router-dom';
import { Flex, Gallery, GalleryItem, PageSection, Title } from '@patternfly/react-core';
import { useSession } from '../../contexts/SessionContext';
import { useComputeInstances, useUsers } from '../../api/hooks';
import { DashboardActionTile } from '../../components/dashboard/DashboardActionTile';
import { DashboardMetricCard } from '../../components/dashboard/DashboardMetricCard';
import { PageHeader } from '../../components/layout/PageHeader';
import '../../components/dashboard/AdminDashboardSection.css';

const TILES = [
  {
    id: 'users',
    label: 'User management',
    icon: '👥',
    desc: 'Manage tenant users and access.',
    path: '/admin/users',
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
];

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { username } = useSession();
  const { data: vms = [] } = useComputeInstances();
  const { data: users = [] } = useUsers();
  const tenantLabel = username ?? 'your organization';

  return (
    <PageSection>
      <PageHeader title="Dashboard" description={`Tenant administration for ${tenantLabel}`} />

      <Flex
        className="osac-admin-dashboard__metrics"
        spaceItems={{ default: 'spaceItemsMd' }}
        flexWrap={{ default: 'wrap' }}
      >
        <DashboardMetricCard label="Total VMs" value={vms.length} />
        <DashboardMetricCard
          label="Running"
          value={vms.filter((v) => v.status.state === 'running').length}
        />
        <DashboardMetricCard label="Users" value={users.length} />
      </Flex>

      <Title headingLevel="h2" size="xl" className="osac-admin-dashboard__section-title">
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
  );
};
