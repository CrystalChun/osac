import type { DemoShellRole } from '@osac/ui-components/shellTypes';

export const defaultRouteForRole = (role: DemoShellRole): string => {
  if (role === 'providerAdmin') {
    return '/provider/dashboard';
  }
  if (role === 'tenantAdmin') {
    return '/admin/dashboard';
  }
  return '/vms';
};
