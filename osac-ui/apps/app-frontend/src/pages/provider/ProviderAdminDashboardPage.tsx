/**
 * flow: provider-administration
 * step: pad_dashboard_home
 */
import { useNavigate } from 'react-router-dom';
import { Flex, Gallery, GalleryItem, PageSection, Title } from '@patternfly/react-core';
import { DEMO_ORGANIZATIONS } from '@osac/api-contracts';
import { useComputeInstances } from '../../api/hooks';
import { DashboardActionTile, DashboardMetricCard } from '../../components/dashboard';
import { PageHeader } from '../../components/layout';

const PROVIDER_TILES = [
  {
    id: 'tenant-organizations',
    label: 'Tenant organizations',
    icon: '🏢',
    desc: 'Manage and view all tenant organizations.',
    path: '/provider/organizations',
  },
  {
    id: 'resource-allocation',
    label: 'Resource allocation',
    icon: '⚖️',
    desc: 'Manage capacity pools and fair-share limits.',
    path: '/provider/allocation',
  },
  {
    id: 'global-templates',
    label: 'Global templates',
    icon: '📋',
    desc: 'Provider-wide template library.',
    path: '/provider/templates',
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
  const { data: vms = [] } = useComputeInstances();
  const totalVms = DEMO_ORGANIZATIONS.reduce((acc, o) => acc + (o.vmCount ?? 0), 0);

  return (
    <PageSection>
      <PageHeader
        title="Provider Dashboard"
        description="Cross-tenant platform overview for Vertexa Cloud Solutions."
      />

      <Flex
        spaceItems={{ default: 'spaceItemsMd' }}
        flexWrap={{ default: 'wrap' }}
        style={{ marginBottom: 'var(--pf-t--global--spacer--xl)' }}
      >
        <DashboardMetricCard label="Tenant orgs" value={DEMO_ORGANIZATIONS.length} />
        <DashboardMetricCard label="Total VMs" value={vms.length + totalVms} />
        <DashboardMetricCard
          label="Active tenants"
          value={DEMO_ORGANIZATIONS.filter((o) => o.status === 'active').length}
        />
      </Flex>

      <Title
        headingLevel="h2"
        size="xl"
        style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}
      >
        Management areas
      </Title>
      <Gallery hasGutter minWidths={{ default: '220px' }}>
        {PROVIDER_TILES.map((tile) => (
          <GalleryItem key={tile.id}>
            <DashboardActionTile
              icon={tile.icon}
              title={tile.label}
              description={tile.desc}
              actionLabel="Open →"
              onAction={() => navigate(tile.path)}
            />
          </GalleryItem>
        ))}
      </Gallery>
    </PageSection>
  );
};
