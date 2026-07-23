/** Demo / OIDC shell roles mapped from Keycloak realm roles. */
export type DemoShellRole = 'providerAdmin' | 'tenantAdmin' | 'tenantUser';

export const isAdminRole = (role: DemoShellRole): boolean =>
  role === 'providerAdmin' || role === 'tenantAdmin';
