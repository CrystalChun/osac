/**
 * flow: provider-administration
 * step: pad_dashboard_home
 */
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Bullseye,
  Flex,
  Gallery,
  GalleryItem,
  PageSection,
  Spinner,
  Title,
} from '@patternfly/react-core';

import { useComputeInstances } from '@osac/ui-components/api/v1/compute-instance';
import { useOrganizations } from '@osac/ui-components/api/v1/organization';
import '@osac/ui-components/components/dashboard/AdminDashboardSection.css';
import { DashboardActionTile } from '@osac/ui-components/components/dashboard/DashboardActionTile';
import { DashboardMetricCard } from '@osac/ui-components/components/dashboard/DashboardMetricCard';
import { PageDataSection } from '@osac/ui-components/components/layout/PageDataSection';
import { PageHeader } from '@osac/ui-components/components/layout/PageHeader';

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
  const { data: vms = [] } = useComputeInstances();
  const {
    data: organizations = [],
    isPending: orgsPending,
    isError: orgsError,
  } = useOrganizations();

  const activeTenants = organizations.filter((o) => readOrganizationStatus(o) === 'active').length;

  return (
    <PageSection isFilled className="osac-page">
      <PageHeader title="Provider Dashboard" description="Cross-tenant platform overview." />

      <PageDataSection scrollable>
        {orgsError ? (
          <Alert
            variant="warning"
            isInline
            title="Organization metrics unavailable"
            className="osac-admin-dashboard__alert"
          >
            Tenant organization counts could not be loaded from the API. VM totals below still
            reflect compute instances visible to your account.
          </Alert>
        ) : null}

        <Flex
          className="osac-admin-dashboard__metrics"
          spaceItems={{ default: 'spaceItemsMd' }}
          flexWrap={{ default: 'wrap' }}
        >
          {orgsPending ? (
            <Bullseye className="osac-admin-dashboard__loading">
              <Spinner aria-label="Loading organization metrics" />
            </Bullseye>
          ) : (
            <>
              <DashboardMetricCard label="Total VMs" value={vms.length} />
              {!orgsError ? (
                <>
                  <DashboardMetricCard label="Tenant orgs" value={organizations.length} />
                  <DashboardMetricCard label="Active tenants" value={activeTenants} />
                </>
              ) : null}
            </>
          )}
        </Flex>

        <Title headingLevel="h2" size="xl" className="osac-admin-dashboard__section-title">
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
      </PageDataSection>
    </PageSection>
  );
};
