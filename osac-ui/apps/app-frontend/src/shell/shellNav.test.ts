import { describe, expect, it } from 'vitest';

import type { DemoShellRole } from '@osac/ui-components/shellTypes';
import { tIdentity } from '@osac/ui-components/test-utils/i18n';

import { navRowsForRole } from './shellNav';

const roles: DemoShellRole[] = ['tenantUser', 'tenantAdmin', 'providerAdmin'];
const adminRoles: DemoShellRole[] = ['tenantAdmin', 'providerAdmin'];

const findSection = (role: DemoShellRole, sectionId: string) =>
  navRowsForRole(role, tIdentity).find((row) => row.sectionId === sectionId);

const servicesChildren = (role: DemoShellRole) =>
  findSection(role, 'nav-tenant-services')?.children ?? [];

describe('navRowsForRole', () => {
  it('includes Catalog, Virtual Machines, Clusters, and Bare Metal under Services for all roles', () => {
    for (const role of roles) {
      expect(servicesChildren(role)).toEqual([
        { id: 'catalog', label: 'Catalog', path: '/catalog' },
        { id: 'compute-vms', label: 'Virtual Machines', path: '/vms' },
        { id: 'clusters', label: 'Clusters', path: '/clusters' },
        { id: 'bare-metal', label: 'Bare Metal', path: '/bare-metal' },
      ]);
    }
  });

  it('includes Networking section for all roles', () => {
    for (const role of roles) {
      const networking = findSection(role, 'nav-tenant-networking');
      expect(networking).toBeDefined();
      expect(networking?.children).toEqual([
        { id: 'virtual-networks', label: 'Virtual networks', path: '/networking/virtual-networks' },
        { id: 'security-groups', label: 'Security groups', path: '/networking/security-groups' },
      ]);
    }
  });

  it('includes Administration section with Catalog management for admin roles', () => {
    for (const role of adminRoles) {
      const admin = findSection(role, 'nav-administration');
      expect(admin).toBeDefined();
      expect(admin?.label).toBe('Administration');
      expect(admin?.children).toEqual([
        { id: 'catalog-management', label: 'Catalog management', path: '/admin/catalog' },
      ]);
    }
  });

  it('does not include Administration section for tenantUser', () => {
    const admin = findSection('tenantUser', 'nav-administration');
    expect(admin).toBeUndefined();
  });
});
