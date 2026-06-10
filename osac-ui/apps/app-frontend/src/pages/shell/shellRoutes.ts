import type { DemoShellRole } from '@osac/api-contracts/types';

export const defaultRouteForRole = (role: DemoShellRole): string => {
  if (role === 'providerAdmin') {
    return '/provider/dashboard';
  }
  if (role === 'tenantAdmin') {
    return '/admin/dashboard';
  }
  return '/dashboard';
};
