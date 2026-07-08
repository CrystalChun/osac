import type { DemoShellRole } from '@osac/ui-components/shellTypes';

export const defaultRouteForRole = (role: DemoShellRole): string => {
  if (role === 'providerAdmin') {
    return '/provider/dashboard';
  }
  // tenantAdmin lands on the same Services entry point as tenantUser (OSAC-2236)
  return '/vms';
};
