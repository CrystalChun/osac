import { describe, expect, it } from 'vitest';

import { defaultRouteForRole } from './shellRoutes';

describe('defaultRouteForRole', () => {
  it('lands tenantAdmin on /vms like tenantUser', () => {
    expect(defaultRouteForRole('tenantAdmin')).toBe('/vms');
    expect(defaultRouteForRole('tenantUser')).toBe('/vms');
  });

  it('keeps providerAdmin on the provider dashboard', () => {
    expect(defaultRouteForRole('providerAdmin')).toBe('/provider/dashboard');
  });
});
