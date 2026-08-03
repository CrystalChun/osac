import { describe, expect, it } from 'vitest';

import type { UserRole } from '@osac/ui-components/shellTypes';
import { tIdentity } from '@osac/ui-components/test-utils/i18n';

import { navRowsForRole } from './shellNav';

const roles: UserRole[] = ['tenant-user', 'tenant-admin', 'admin'];

const findSection = (role: UserRole, sectionId: string) =>
  navRowsForRole(role, tIdentity).find((row) => row.sectionId === sectionId);

const servicesChildren = (role: UserRole) =>
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

  it('Administration section shows up only for admin role', () => {
    expect(findSection('admin', 'nav-administration')).toBeDefined();
    for (const role of ['tenant-user', 'tenant-admin', 'tenant-idp-manager'] as UserRole[]) {
      expect(findSection(role, 'nav-administration')).toBeUndefined();
    }
  });

  it('IDP administration shows up only for idp manager', () => {
    expect(findSection('tenant-idp-manager', 'nav-tenant-administration')).toBeDefined();
    for (const role of ['tenant-user', 'tenant-admin', 'admin'] as UserRole[]) {
      expect(findSection(role, 'nav-tenant-administration')).toBeUndefined();
    }
  });
});
