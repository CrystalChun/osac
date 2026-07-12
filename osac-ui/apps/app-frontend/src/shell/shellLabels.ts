import type { DemoShellRole } from '@osac/ui-components/shellTypes';

const OPERATING_MODE_LABELS: Record<DemoShellRole, string> = {
  providerAdmin: 'Cloud provider admin',
  tenantAdmin: 'Tenant admin',
  tenantUser: 'Tenant user',
};

/** Masthead operating-mode label for the signed-in shell role. */
export const operatingModeLabel = (role: DemoShellRole): string => OPERATING_MODE_LABELS[role] ?? role;
