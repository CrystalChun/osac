/** Role-based sidebar navigation (sectioned NavGroup layout). Nav icons: shellNavIcon in @osac/ui-components/icons */
import type { TFunction } from 'i18next';

import type { UserRole } from '@osac/ui-components/shellTypes';

export const isNavSection = (row: NavRow): row is NavSection => row.kind === 'section';

export type NavLink = { kind: 'link'; id: string; label: string; path: string };

export type NavSection = {
  kind: 'section';
  id: string;
  label: string;
  children: NavLink[];
};

type NavRow = NavSection | NavLink;

const getTenantAdminSection = (t: TFunction): NavRow => ({
  kind: 'section',
  id: 'nav-tenant-administration',
  label: t('Tenant'),
  children: [
    { kind: 'link', id: 'idp', label: t('Identity providers'), path: '/tenant/identity-provider' },
    { kind: 'link', id: 'role-bindings', label: t('Role Bindings'), path: '/tenant/role-binding' },
  ],
});

const getIdpManagerNav = (t: TFunction): NavRow[] => [getTenantAdminSection(t)];

const getAdminNav = (t: TFunction): NavRow[] => [
  {
    kind: 'section',
    id: 'nav-administration',
    label: t('Administration'),
    children: [{ kind: 'link', id: 'tenant', label: t('Tenants'), path: '/admin/tenants' }],
  },
  {
    kind: 'section',
    id: 'nav-infrastructure',
    label: t('Infrastructure'),
    children: [
      {
        kind: 'link',
        id: 'storage',
        label: t('Storage'),
        path: '/admin/infrastructure/storage',
      },
      {
        kind: 'link',
        id: 'instance-types',
        label: t('Instance types'),
        path: '/admin/infrastructure/instance-types',
      },
      {
        kind: 'link',
        id: 'baremetal-instance-types',
        label: t('Bare metal instance types'),
        path: '/admin/infrastructure/baremetal-instance-types',
      },
      {
        kind: 'link',
        id: 'disk-images',
        label: t('Disk images'),
        path: '/admin/infrastructure/disk-images',
      },
    ],
  },
  getTenantAdminSection(t),
  ...getBaseNav(t),
];

const getTenantAdminNav = (t: TFunction): NavRow[] => [getTenantAdminSection(t), ...getBaseNav(t)];

const getBaseNav = (t: TFunction): NavRow[] => [
  { kind: 'link', id: 'catalog', label: t('Catalog'), path: '/catalog' },
  {
    kind: 'section',
    id: 'nav-tenant-services',
    label: t('Services'),
    children: [
      { kind: 'link', id: 'compute-vms', label: t('Virtual Machines'), path: '/vms' },
      { kind: 'link', id: 'clusters', label: t('Clusters'), path: '/clusters' },
      { kind: 'link', id: 'bare-metal', label: t('Bare Metal'), path: '/bare-metal' },
    ],
  },
  { kind: 'link', id: 'projects', label: t('Projects'), path: '/projects' },
  {
    kind: 'section',
    id: 'nav-tenant-networking',
    label: t('Networking'),
    children: [
      {
        kind: 'link',
        id: 'virtual-networks',
        label: t('Virtual networks'),
        path: '/networking/virtual-networks',
      },
      {
        kind: 'link',
        id: 'security-groups',
        label: t('Security groups'),
        path: '/networking/security-groups',
      },
    ],
  },
];

export const navRowsForRole = (role: UserRole, t: TFunction): NavRow[] => {
  if (role === 'admin') {
    return getAdminNav(t);
  }

  if (role === 'tenant-idp-manager') {
    return getIdpManagerNav(t);
  }

  if (role === 'tenant-admin') {
    return getTenantAdminNav(t);
  }

  return getBaseNav(t);
};
