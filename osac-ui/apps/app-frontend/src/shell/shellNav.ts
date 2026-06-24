/** Role-based sidebar navigation (sectioned NavGroup layout). Nav icons: shellNavIcon in @osac/ui-components/icons */
import type { TFunction } from 'i18next';

import type { DemoShellRole } from '@osac/ui-components/shellTypes';

export type NavLink = { id: string; label: string; path: string };

export type NavSection = {
  kind: 'section';
  sectionId: string;
  label: string;
  children: NavLink[];
};

export type NavRow = NavSection;

const getTenantUserNav = (t: TFunction): NavRow[] => [
  {
    kind: 'section',
    sectionId: 'nav-tenant-services',
    label: t('Services'),
    children: [
      { id: 'catalog', label: t('Catalog'), path: '/catalog' },
      { id: 'compute-vms', label: t('Virtual Machines'), path: '/vms' },
      { id: 'clusters', label: t('Clusters'), path: '/clusters' },
    ],
  },
];

const getTenantAdminNav = (t: TFunction): NavRow[] => [
  {
    kind: 'section',
    sectionId: 'nav-admin-overview',
    label: t('Overview'),
    children: [{ id: 'admin-dashboard', label: t('Dashboard'), path: '/admin/dashboard' }],
  },
  {
    kind: 'section',
    sectionId: 'nav-admin-services',
    label: t('Services'),
    children: [{ id: 'clusters', label: t('Clusters'), path: '/clusters' }],
  },
  {
    kind: 'section',
    sectionId: 'nav-admin-mgmt',
    label: t('Management'),
    children: [
      { id: 'admin-users', label: t('Users'), path: '/admin/users' },
      { id: 'admin-catalog', label: t('Catalog'), path: '/admin/catalog' },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-admin-infra',
    label: t('Infrastructure'),
    children: [{ id: 'admin-networks', label: t('Networks'), path: '/admin/networks' }],
  },
];

const getProviderAdminNav = (t: TFunction): NavRow[] => [
  {
    kind: 'section',
    sectionId: 'nav-provider-overview',
    label: t('Overview'),
    children: [{ id: 'provider-dashboard', label: t('Dashboard'), path: '/provider/dashboard' }],
  },
  {
    kind: 'section',
    sectionId: 'nav-provider-mgmt',
    label: t('Management'),
    children: [
      { id: 'provider-orgs', label: t('Tenant organizations'), path: '/provider/organizations' },
      { id: 'provider-catalog', label: t('Global catalog'), path: '/provider/catalog' },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-provider-infra',
    label: t('Infrastructure'),
    children: [
      { id: 'provider-infra', label: t('Infrastructure'), path: '/provider/infrastructure' },
    ],
  },
];

export const navRowsForRole = (role: DemoShellRole, t: TFunction): NavRow[] => {
  if (role === 'providerAdmin') {
    return getProviderAdminNav(t);
  }
  if (role === 'tenantAdmin') {
    return getTenantAdminNav(t);
  }
  return getTenantUserNav(t);
};
