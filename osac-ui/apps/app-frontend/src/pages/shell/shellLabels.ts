import type { DemoShellRole } from '@osac/ui-components/shellTypes';

/** Masthead operating-mode label for the signed-in shell role. */
export const operatingModeLabel = (role: DemoShellRole): string => {
  if (role === 'providerAdmin') {
    return 'Provider console';
  }
  if (role === 'tenantAdmin') {
    return 'Tenant admin';
  }
  return 'VMaaS workspace';
};
