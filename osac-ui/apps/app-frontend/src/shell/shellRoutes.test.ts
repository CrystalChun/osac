import { describe, expect, it } from 'vitest';

import { defaultRouteForRole } from './shellRoutes';

describe('defaultRouteForRole', () => {
  it('lands every role on /catalog', () => {
    expect(defaultRouteForRole('tenant-user')).toBe('/catalog');
    expect(defaultRouteForRole('tenant-admin')).toBe('/catalog');
    expect(defaultRouteForRole('tenant-idp-manager')).toBe('/catalog');
    expect(defaultRouteForRole('admin')).toBe('/catalog');
  });
});
