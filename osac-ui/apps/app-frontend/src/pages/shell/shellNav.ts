import type { DemoShellRole } from '@osac/api-contracts/types';

export type NavRow =
  | { kind: 'link'; id: string; label: string; path: string }
  | {
      kind: 'expand';
      label: string;
      groupId: string;
      children: { id: string; label: string; path: string }[];
    };

const TENANT_USER_NAV: NavRow[] = [
  { kind: 'link', id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { kind: 'link', id: 'compute-vms', label: 'My VMs', path: '/vms' },
  { kind: 'link', id: 'catalog', label: 'Templates', path: '/templates' },
];

const TENANT_ADMIN_NAV: NavRow[] = [
  { kind: 'link', id: 'admin-dashboard', label: 'Dashboard', path: '/admin/dashboard' },
  {
    kind: 'expand',
    label: 'Management',
    groupId: 'nav-admin-mgmt',
    children: [
      { id: 'admin-users', label: 'Users', path: '/admin/users' },
      { id: 'admin-templates', label: 'Template catalog', path: '/admin/templates' },
    ],
  },
  { kind: 'link', id: 'admin-networks', label: 'Networks', path: '/admin/networks' },
];

const PROVIDER_ADMIN_NAV: NavRow[] = [
  { kind: 'link', id: 'provider-dashboard', label: 'Dashboard', path: '/provider/dashboard' },
  {
    kind: 'expand',
    label: 'Management',
    groupId: 'nav-provider-mgmt',
    children: [
      { id: 'provider-orgs', label: 'Tenant organizations', path: '/provider/organizations' },
      { id: 'provider-templates', label: 'Global templates', path: '/provider/templates' },
    ],
  },
  { kind: 'link', id: 'provider-infra', label: 'Infrastructure', path: '/provider/infrastructure' },
];

export const DEFAULT_EXPANDED_GROUP_IDS = ['nav-admin-mgmt', 'nav-provider-mgmt'];

export const navRowsForRole = (role: DemoShellRole): NavRow[] => {
  if (role === 'providerAdmin') {
    return PROVIDER_ADMIN_NAV;
  }
  if (role === 'tenantAdmin') {
    return TENANT_ADMIN_NAV;
  }
  return TENANT_USER_NAV;
};
