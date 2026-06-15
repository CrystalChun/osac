/**
 * flow: tenant-administration
 * step: tad_dashboard_home
 */
import { useNavigate } from 'react-router-dom';
import { Flex, Gallery, GalleryItem, PageSection, Title } from '@patternfly/react-core';

import { useComputeInstances } from '@osac/ui-components/api/v1/compute-instance';
import { useUsers } from '@osac/ui-components/api/v1/user';
import { useSession } from '@osac/ui-components/hooks/use-session';
import {
  COMPUTE_INSTANCE_STATE,
  readComputeInstanceState,
} from '@osac/ui-components/vmDisplayState';

import { DashboardActionTile } from '../../components/dashboard/DashboardActionTile';
import { DashboardMetricCard } from '../../components/dashboard/DashboardMetricCard';
import { PageDataSection } from '../../components/layout/PageDataSection';
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
    id: 'catalog',
    label: 'Catalog',
    icon: '📋',
    desc: 'Browse and manage VM catalog items.',
    path: '/admin/catalog',
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
    <PageSection isFilled className="osac-page">
      <PageHeader title="Dashboard" description={`Tenant administration for ${tenantLabel}`} />

      <PageDataSection scrollable>
        <Flex
          className="osac-admin-dashboard__metrics"
          spaceItems={{ default: 'spaceItemsMd' }}
          flexWrap={{ default: 'wrap' }}
        >
          <DashboardMetricCard label="Total VMs" value={vms.length} />
          <DashboardMetricCard
            label="Running"
            value={
              vms.filter((v) => readComputeInstanceState(v) === COMPUTE_INSTANCE_STATE.RUNNING)
                .length
            }
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
      </PageDataSection>
    </PageSection>
  );
};
