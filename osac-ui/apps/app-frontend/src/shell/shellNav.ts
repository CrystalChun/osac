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
  {
    kind: 'section',
    sectionId: 'nav-tenant-networking',
    label: t('Networking'),
    children: [
      {
        id: 'virtual-networks',
        label: t('Virtual Networks'),
        path: '/networking/virtual-networks',
      },
    ],
  },
];

export const navRowsForRole = (_role: DemoShellRole, t: TFunction): NavRow[] => getTenantUserNav(t);
