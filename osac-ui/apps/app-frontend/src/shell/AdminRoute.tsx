import { Navigate } from 'react-router-dom';

import { isAdminRole } from '@osac/ui-components/helpers/isAdminRole';
import { useSession } from '@osac/ui-components/hooks/use-session';

import { ProviderCatalogRoutes } from './ProviderCatalogRoutes';
import { TenantAdminCatalogRoutes } from './TenantAdminCatalogRoutes';

export const AdminRoute = () => {
  const { role } = useSession();

  if (!isAdminRole(role)) {
    return <Navigate to="/catalog" replace />;
  }

  if (role === 'providerAdmin') {
    return <ProviderCatalogRoutes />;
  }

  return <TenantAdminCatalogRoutes />;
};
