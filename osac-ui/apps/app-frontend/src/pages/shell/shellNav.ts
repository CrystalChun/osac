/** Role-based sidebar navigation (sectioned NavGroup layout). Icons: shellNavIcons.tsx */
import type { DemoShellRole } from '@osac/ui-components/shellTypes';

export type NavLink = { id: string; label: string; path: string };

export type NavSection = {
  kind: 'section';
  sectionId: string;
  label: string;
  children: NavLink[];
};

export type NavRow = NavSection;

const TENANT_USER_NAV: NavRow[] = [
  {
    kind: 'section',
    sectionId: 'nav-tenant-workloads',
    label: 'Workloads',
    children: [
      { id: 'compute-vms', label: 'Virtual machines', path: '/vms' },
      { id: 'catalog', label: 'Catalog', path: '/catalog' },
    ],
  },
];

const TENANT_ADMIN_NAV: NavRow[] = [
  {
    kind: 'section',
    sectionId: 'nav-admin-overview',
    label: 'Overview',
    children: [{ id: 'admin-dashboard', label: 'Dashboard', path: '/admin/dashboard' }],
  },
  {
    kind: 'section',
    sectionId: 'nav-admin-mgmt',
    label: 'Management',
    children: [
      { id: 'admin-users', label: 'Users', path: '/admin/users' },
      { id: 'admin-catalog', label: 'Catalog', path: '/admin/catalog' },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-admin-infra',
    label: 'Infrastructure',
    children: [{ id: 'admin-networks', label: 'Networks', path: '/admin/networks' }],
  },
];

const PROVIDER_ADMIN_NAV: NavRow[] = [
  {
    kind: 'section',
    sectionId: 'nav-provider-overview',
    label: 'Overview',
    children: [{ id: 'provider-dashboard', label: 'Dashboard', path: '/provider/dashboard' }],
  },
  {
    kind: 'section',
    sectionId: 'nav-provider-mgmt',
    label: 'Management',
    children: [
      { id: 'provider-orgs', label: 'Tenant organizations', path: '/provider/organizations' },
      { id: 'provider-catalog', label: 'Global catalog', path: '/provider/catalog' },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-provider-infra',
    label: 'Infrastructure',
    children: [{ id: 'provider-infra', label: 'Infrastructure', path: '/provider/infrastructure' }],
  },
];

export const navRowsForRole = (role: DemoShellRole): NavRow[] => {
  if (role === 'providerAdmin') {
    return PROVIDER_ADMIN_NAV;
  }
  if (role === 'tenantAdmin') {
    return TENANT_ADMIN_NAV;
  }
  return TENANT_USER_NAV;
};
