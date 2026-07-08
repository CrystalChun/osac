import { describe, expect, it } from 'vitest';

import { defaultRouteForRole } from './shellRoutes';

describe('defaultRouteForRole', () => {
  it('lands every role on /catalog', () => {
    expect(defaultRouteForRole('tenantUser')).toBe('/catalog');
    expect(defaultRouteForRole('tenantAdmin')).toBe('/catalog');
    expect(defaultRouteForRole('providerAdmin')).toBe('/catalog');
  });
});
