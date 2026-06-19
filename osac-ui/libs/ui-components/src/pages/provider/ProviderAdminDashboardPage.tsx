import { useNavigate } from 'react-router-dom';
import { Flex, Gallery, GalleryItem, Title } from '@patternfly/react-core';

import { useComputeInstances } from '@osac/ui-components/api/v1/compute-instance';
import { useOrganizations } from '@osac/ui-components/api/v1/organization';
import { DashboardActionTile } from '@osac/ui-components/components/dashboard/DashboardActionTile';
import { DashboardMetricCard } from '@osac/ui-components/components/dashboard/DashboardMetricCard';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';

import { readOrganizationStatus } from '../../utils/adminWireDisplay';

const PROVIDER_TILES = [
  {
    id: 'tenant-organizations',
    label: 'Tenant organizations',
    icon: '🏢',
    desc: 'Manage and view all tenant organizations.',
    path: '/provider/organizations',
  },
  {
    id: 'global-catalog',
    label: 'Global catalog',
    icon: '📋',
    desc: 'Provider-wide VM catalog.',
    path: '/provider/catalog',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    icon: '🖥️',
    desc: 'View platform infrastructure topology.',
    path: '/provider/infrastructure',
  },
];

export const ProviderAdminDashboardPage = () => {
  const navigate = useNavigate();
  const { data: vms = [], isLoading: vmsLoading, error: vmsError } = useComputeInstances();
  const { data: organizations = [], isLoading: orgsLoading, error: orgsError } = useOrganizations();

  const activeTenants = organizations.filter((o) => readOrganizationStatus(o) === 'active').length;

  return (
    <ListPage title="Provider Dashboard" description="Cross-tenant platform overview.">
      <ListPageBody isLoading={vmsLoading || orgsLoading} error={vmsError || orgsError}>
        <Flex spaceItems={{ default: 'spaceItemsMd' }} flexWrap={{ default: 'wrap' }}>
          <DashboardMetricCard label="Total VMs" value={vms.length} />
          <DashboardMetricCard label="Tenant orgs" value={organizations.length} />
          <DashboardMetricCard label="Active tenants" value={activeTenants} />
        </Flex>

        <Title headingLevel="h2" size="xl">
          Management areas
        </Title>
        <Gallery hasGutter minWidths={{ default: '220px' }}>
          {PROVIDER_TILES.map((tile) => (
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
