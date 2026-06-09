import type { DemoShellRole } from '@osac/api-contracts';

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
      { id: 'admin-quota', label: 'Quota control', path: '/admin/quota' },
      { id: 'admin-templates', label: 'Template catalog', path: '/admin/templates' },
    ],
  },
  {
    kind: 'expand',
    label: 'Infrastructure',
    groupId: 'nav-admin-infra',
    children: [
      { id: 'admin-networks', label: 'Networks', path: '/admin/networks' },
      { id: 'admin-storage', label: 'Storage', path: '/admin/storage' },
    ],
  },
  {
    kind: 'expand',
    label: 'Organization',
    groupId: 'nav-admin-org',
    children: [
      { id: 'admin-org-settings', label: 'Organization settings', path: '/admin/org-settings' },
      { id: 'admin-org-security', label: 'Security & Compliance', path: '/admin/security' },
    ],
  },
];

const PROVIDER_ADMIN_NAV: NavRow[] = [
  { kind: 'link', id: 'provider-dashboard', label: 'Dashboard', path: '/provider/dashboard' },
  {
    kind: 'expand',
    label: 'Management',
    groupId: 'nav-provider-mgmt',
    children: [
      { id: 'provider-orgs', label: 'Tenant organizations', path: '/provider/organizations' },
      { id: 'provider-allocation', label: 'Resource allocation', path: '/provider/allocation' },
      { id: 'provider-templates', label: 'Global templates', path: '/provider/templates' },
    ],
  },
  {
    kind: 'expand',
    label: 'System',
    groupId: 'nav-provider-system',
    children: [
      { id: 'provider-infra', label: 'Infrastructure', path: '/provider/infrastructure' },
      { id: 'provider-security', label: 'Security & Compliance', path: '/provider/security' },
      { id: 'provider-settings', label: 'Platform settings', path: '/provider/settings' },
    ],
  },
];

export const DEFAULT_EXPANDED_GROUP_IDS = [
  'nav-admin-mgmt',
  'nav-admin-infra',
  'nav-admin-org',
  'nav-provider-mgmt',
  'nav-provider-system',
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
