/** Role-based sidebar navigation (sectioned NavGroup layout). Nav icons: shellNavIcon in @osac/ui-components/icons */
import type { TFunction } from 'i18next';

import type { UserRole } from '@osac/ui-components/shellTypes';

export type NavLink = { id: string; label: string; path: string };

type NavSection = {
  kind: 'section';
  sectionId: string;
  label: string;
  children: NavLink[];
};

const getAdminNav = (t: TFunction): NavSection[] => [
  {
    kind: 'section',
    sectionId: 'nav-administration',
    label: t('Administration'),
    children: [{ id: 'tenant', label: t('Tenants'), path: '/admin/tenants' }],
  },
  ...getBaseNav(t),
];

const getBaseNav = (t: TFunction): NavSection[] => [
  {
    kind: 'section',
    sectionId: 'nav-tenant-services',
    label: t('Services'),
    children: [
      { id: 'catalog', label: t('Catalog'), path: '/catalog' },
      { id: 'compute-vms', label: t('Virtual Machines'), path: '/vms' },
      { id: 'clusters', label: t('Clusters'), path: '/clusters' },
      { id: 'bare-metal', label: t('Bare Metal'), path: '/bare-metal' },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-tenant-networking',
    label: t('Networking'),
    children: [
      {
        id: 'virtual-networks',
        label: t('Virtual networks'),
        path: '/networking/virtual-networks',
      },
      {
        id: 'security-groups',
        label: t('Security groups'),
        path: '/networking/security-groups',
      },
    ],
  },
];

export const navRowsForRole = (role: UserRole, t: TFunction): NavSection[] => {
  if (role === 'admin') {
    return getAdminNav(t);
  }

  return getBaseNav(t);
};
