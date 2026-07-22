import { describe, expect, it } from 'vitest';

import type { DemoShellRole } from '../shellTypes';
import { isAdminRole } from './isAdminRole';

describe('isAdminRole', () => {
  it('returns true for providerAdmin', () => {
    expect(isAdminRole('providerAdmin')).toBe(true);
  });

  it('returns true for tenantAdmin', () => {
    expect(isAdminRole('tenantAdmin')).toBe(true);
  });

  it('returns false for tenantUser', () => {
    expect(isAdminRole('tenantUser')).toBe(false);
  });

  it('returns false for unknown roles', () => {
    expect(isAdminRole('unknownRole' as DemoShellRole)).toBe(false);
  });
});
