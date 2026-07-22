import type { DemoShellRole } from '../shellTypes';

export const isAdminRole = (role: DemoShellRole): boolean =>
  role === 'providerAdmin' || role === 'tenantAdmin';
