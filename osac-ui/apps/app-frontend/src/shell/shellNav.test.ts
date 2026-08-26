import { describe, expect, it } from 'vitest';

import type { UserRole } from '@osac/ui-components/shellTypes';
import { tIdentity } from '@osac/ui-components/test-utils/i18n';

import { NavSection, isNavSection, navRowsForRole } from './shellNav';

const roles: UserRole[] = ['tenant-user', 'tenant-admin', 'admin'];

const findSection = (role: UserRole, sectionId: string): NavSection | undefined =>
  navRowsForRole(role, tIdentity).find((row) => isNavSection(row) && row.id === sectionId) as
    | NavSection
    | undefined;

const servicesChildren = (role: UserRole) =>
  findSection(role, 'nav-tenant-services')?.children ?? [];

describe('navRowsForRole', () => {
  it('includes Virtual Machines, Clusters, and Bare Metal under Services for all roles', () => {
    for (const role of roles) {
      expect(servicesChildren(role)).toEqual([
        { kind: 'link', id: 'compute-vms', label: 'Virtual Machines', path: '/vms' },
        { kind: 'link', id: 'clusters', label: 'Clusters', path: '/clusters' },
        { kind: 'link', id: 'bare-metal', label: 'Bare Metal', path: '/bare-metal' },
      ]);
    }
  });

  it('includes Networking section for all roles', () => {
    for (const role of roles) {
      const networking = findSection(role, 'nav-tenant-networking');
      expect(networking).toBeDefined();
      expect(networking?.children).toEqual([
        {
          kind: 'link',
          id: 'virtual-networks',
          label: 'Virtual networks',
          path: '/networking/virtual-networks',
        },
        {
          kind: 'link',
          id: 'security-groups',
          label: 'Security groups',
          path: '/networking/security-groups',
        },
      ]);
    }
  });

  it('Administration section shows up only for admin role', () => {
    expect(findSection('admin', 'nav-administration')).toBeDefined();
    for (const role of ['tenant-user', 'tenant-admin', 'tenant-idp-manager'] as UserRole[]) {
      expect(findSection(role, 'nav-administration')).toBeUndefined();
    }
  });

  it('includes only Tenants under Administration for admin role', () => {
    expect(findSection('admin', 'nav-administration')?.children).toEqual([
      { kind: 'link', id: 'tenant', label: 'Tenants', path: '/admin/tenants' },
    ]);
  });

  it('Infrastructure section shows up only for admin role and contains storage, instance types, and disk images', () => {
    expect(findSection('admin', 'nav-infrastructure')).toEqual({
      kind: 'section',
      id: 'nav-infrastructure',
      label: 'Infrastructure',
      children: [
        {
          kind: 'link',
          id: 'storage',
          label: 'Storage',
          path: '/admin/infrastructure/storage',
        },
        {
          kind: 'link',
          id: 'instance-types',
          label: 'Instance types',
          path: '/admin/infrastructure/instance-types',
        },
        {
          kind: 'link',
          id: 'disk-images',
          label: 'Disk images',
          path: '/admin/infrastructure/disk-images',
        },
      ],
    });
    for (const role of ['tenant-user', 'tenant-admin', 'tenant-idp-manager'] as UserRole[]) {
      expect(findSection(role, 'nav-infrastructure')).toBeUndefined();
    }
  });

  it('Tenant section shows up for admin, tenant-admin, and tenant-idp-manager', () => {
    for (const role of ['admin', 'tenant-admin', 'tenant-idp-manager'] as UserRole[]) {
      const section = findSection(role, 'nav-tenant-administration');
      expect(section).toBeDefined();
      expect(section?.children.map((c) => c.id)).toContain('idp');
      expect(section?.children.map((c) => c.id)).toContain('role-bindings');
    }
    expect(findSection('tenant-user', 'nav-tenant-administration')).toBeUndefined();
  });
});
