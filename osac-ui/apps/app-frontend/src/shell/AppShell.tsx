import { type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Page } from '@patternfly/react-core';

import ErrorBoundary from '@osac/ui-components/components/ErrorBoundary/ErrorBoundary';
import { VmDetailsPage } from '@osac/ui-components/components/vm/VmDetailsPage';
import { isAdminRole } from '@osac/ui-components/helpers/isAdminRole';
import { useSession } from '@osac/ui-components/hooks/use-session';
import { SecurityGroupDetailPage } from '@osac/ui-components/pages/networking/SecurityGroupDetailPage';
import { SecurityGroupsListPage } from '@osac/ui-components/pages/networking/SecurityGroupsListPage';
import { VirtualNetworkDetailPage } from '@osac/ui-components/pages/networking/VirtualNetworkDetailPage';
import { VirtualNetworksListPage } from '@osac/ui-components/pages/networking/VirtualNetworksListPage';
import { BareMetalRoutes } from '@osac/ui-components/pages/tenant/BareMetalRoutes';
import CatalogPage from '@osac/ui-components/pages/tenant/CatalogPage';
import { ClusterRoutes } from '@osac/ui-components/pages/tenant/ClusterRoutes';
import { VmCreatePage } from '@osac/ui-components/pages/tenant/VmCreatePage';
import { VmListPage } from '@osac/ui-components/pages/tenant/VmListPage';

import { ProviderCatalogRoutes } from './ProviderCatalogRoutes';
import { ShellMasthead } from './ShellMasthead';
import { defaultRouteForRole } from './shellRoutes';
import { ShellSidebar } from './ShellSidebar';
import { TenantAdminCatalogRoutes } from './TenantAdminCatalogRoutes';

const ShellRoute = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();

  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
};

export const AppShell = ({ logout }: { logout: () => Promise<void> }) => {
  const { role } = useSession();

  const defaultRoute = defaultRouteForRole(role);

  return (
    <Page
      masthead={<ShellMasthead onLogout={logout} />}
      sidebar={<ShellSidebar />}
      isManagedSidebar
    >
      <Routes>
        <Route
          path="/vms"
          element={
            <ShellRoute>
              <VmListPage />
            </ShellRoute>
          }
        />
        <Route
          path="/vms/create/:catalogItemId?"
          element={
            <ShellRoute>
              <VmCreatePage />
            </ShellRoute>
          }
        />
        <Route
          path="/vms/:id"
          element={
            <ShellRoute>
              <VmDetailsPage />
            </ShellRoute>
          }
        />
        <Route
          path="/catalog"
          element={
            <ShellRoute>
              <CatalogPage />
            </ShellRoute>
          }
        />
        <Route
          path="/clusters/*"
          element={
            <ShellRoute>
              <ClusterRoutes />
            </ShellRoute>
          }
        />
        <Route
          path="/bare-metal/*"
          element={
            <ShellRoute>
              <BareMetalRoutes />
            </ShellRoute>
          }
        />
        <Route
          path="/networking/virtual-networks"
          element={
            <ShellRoute>
              <VirtualNetworksListPage />
            </ShellRoute>
          }
        />
        <Route
          path="/networking/virtual-networks/:id"
          element={
            <ShellRoute>
              <VirtualNetworkDetailPage />
            </ShellRoute>
          }
        />
        <Route
          path="/networking/security-groups"
          element={
            <ShellRoute>
              <SecurityGroupsListPage />
            </ShellRoute>
          }
        />
        <Route
          path="/networking/security-groups/:id"
          element={
            <ShellRoute>
              <SecurityGroupDetailPage />
            </ShellRoute>
          }
        />

        {isAdminRole(role) && (
          <Route
            path="/admin/catalog/*"
            element={
              <ShellRoute>
                {role === 'providerAdmin' ? (
                  <ProviderCatalogRoutes />
                ) : (
                  <TenantAdminCatalogRoutes />
                )}
              </ShellRoute>
            }
          />
        )}

        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </Page>
  );
};
