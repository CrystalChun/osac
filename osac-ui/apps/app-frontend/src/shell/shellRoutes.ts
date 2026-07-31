import type { UserRole } from '@osac/ui-components/shellTypes';

export const defaultRouteForRole = (role: UserRole): string => {
  if (role === 'admin') {
    return '/admin/tenants';
  }
  return '/catalog';
};
