/**
 * flow: tenant-administration
 * step: tad_dashboard_home
 */
import { useNavigate } from 'react-router-dom';
import { Flex, Gallery, GalleryItem, Title } from '@patternfly/react-core';

import { useComputeInstances } from '@osac/ui-components/api/v1/compute-instance';
import { useUsers } from '@osac/ui-components/api/v1/user';
import { DashboardActionTile } from '@osac/ui-components/components/dashboard/DashboardActionTile';
import { DashboardMetricCard } from '@osac/ui-components/components/dashboard/DashboardMetricCard';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { useSession } from '@osac/ui-components/hooks/use-session';
import {
  COMPUTE_INSTANCE_STATE,
  readComputeInstanceState,
} from '@osac/ui-components/vmDisplayState';

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
  const { data: vms = [], isLoading: vmsLoading, error: vmsError } = useComputeInstances();
  const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers();
  const tenantLabel = username ?? 'your organization';

  return (
    <ListPage title="Dashboard" description={`Tenant administration for ${tenantLabel}`}>
      <ListPageBody isLoading={vmsLoading || usersLoading} error={vmsError || usersError}>
        <Flex spaceItems={{ default: 'spaceItemsMd' }} flexWrap={{ default: 'wrap' }}>
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
        <Title headingLevel="h2" size="xl">
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
      </ListPageBody>
    </ListPage>
  );
};
