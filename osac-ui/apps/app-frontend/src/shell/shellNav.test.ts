import { describe, expect, it } from 'vitest';

import type { DemoShellRole } from '@osac/ui-components/shellTypes';
import { tIdentity } from '@osac/ui-components/test-utils/i18n';

import { navRowsForRole } from './shellNav';

const roles: DemoShellRole[] = ['tenantUser', 'tenantAdmin', 'providerAdmin'];

const servicesChildren = (role: DemoShellRole) =>
  navRowsForRole(role, tIdentity).find((row) => row.sectionId === 'nav-tenant-services')
    ?.children ?? [];

describe('navRowsForRole', () => {
  it('returns the same tenant user nav for every role', () => {
    const tenantUserNav = navRowsForRole('tenantUser', tIdentity);

    for (const role of roles) {
      expect(navRowsForRole(role, tIdentity)).toEqual(tenantUserNav);
    }
  });

  it('includes Catalog, Virtual Machines, and Clusters under Services', () => {
    for (const role of roles) {
      expect(servicesChildren(role)).toEqual([
        { id: 'catalog', label: 'Catalog', path: '/catalog' },
        { id: 'compute-vms', label: 'Virtual Machines', path: '/vms' },
        { id: 'clusters', label: 'Clusters', path: '/clusters' },
        { id: 'bare-metal', label: 'Bare Metal', path: '/bare-metal' },
      ]);
    }
  });
});
