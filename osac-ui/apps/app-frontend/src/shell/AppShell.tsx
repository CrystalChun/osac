import { type ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Page } from '@patternfly/react-core';

import ErrorBoundary from '@osac/ui-components/components/ErrorBoundary/ErrorBoundary';
import { VmDetailsPage } from '@osac/ui-components/components/vm/VmDetailsPage';
import { useSession } from '@osac/ui-components/hooks/use-session';
import { AdminDashboardPage } from '@osac/ui-components/pages/admin/AdminDashboardPage';
import { AdminNetworksPage } from '@osac/ui-components/pages/admin/AdminNetworksPage';
import { AdminUsersPage } from '@osac/ui-components/pages/admin/AdminUsersPage';
import { ProviderAdminDashboardPage } from '@osac/ui-components/pages/provider/ProviderAdminDashboardPage';
import { ProviderInfraTopologyPage } from '@osac/ui-components/pages/provider/ProviderInfraTopologyPage';
import { ProviderTenantOrgsPage } from '@osac/ui-components/pages/provider/ProviderTenantOrgsPage';
import { CatalogPage } from '@osac/ui-components/pages/tenant/CatalogPage';
import { ClusterRoutes } from '@osac/ui-components/pages/tenant/ClusterRoutes';
import { VmCreatePage } from '@osac/ui-components/pages/tenant/VmCreatePage';
import { VmListPage } from '@osac/ui-components/pages/tenant/VmListPage';
import { VirtualNetworkDetailPage } from '@osac/ui-components/pages/networking/VirtualNetworkDetailPage';
import { VirtualNetworksListPage } from '@osac/ui-components/pages/networking/VirtualNetworksListPage';
import type { DemoShellRole } from '@osac/ui-components/shellTypes';

import { ShellMasthead } from './ShellMasthead';
import { defaultRouteForRole } from './shellRoutes';
import { ShellSidebar } from './ShellSidebar';

const RoleRoute = ({
  allow,
  fallback,
  children,
}: {
  allow: DemoShellRole[];
  fallback: string;
  children: ReactElement;
}) => {
  const { role } = useSession();
  return allow.includes(role) ? (
    <ErrorBoundary>{children}</ErrorBoundary>
  ) : (
    <Navigate to={fallback} replace />
  );
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
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <VmListPage />
            </RoleRoute>
          }
        />
        <Route
          path="/vms/create/:catalogItemId?"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <VmCreatePage />
            </RoleRoute>
          }
        />
        <Route
          path="/vms/:id"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <VmDetailsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/catalog"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <CatalogPage />
            </RoleRoute>
          }
        />
        <Route
          path="/clusters/*"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <ClusterRoutes />
            </RoleRoute>
          }
        />

        <Route
          path="/networking/virtual-networks"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <VirtualNetworksListPage />
            </RoleRoute>
          }
        />
        <Route
          path="/networking/virtual-networks/:id"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <VirtualNetworkDetailPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <RoleRoute allow={['tenantAdmin']} fallback={defaultRoute}>
              <AdminDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleRoute allow={['tenantAdmin']} fallback={defaultRoute}>
              <AdminUsersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/catalog"
          element={
            <RoleRoute allow={['tenantAdmin']} fallback={defaultRoute}>
              <CatalogPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/networks"
          element={
            <RoleRoute allow={['tenantAdmin']} fallback={defaultRoute}>
              <AdminNetworksPage />
            </RoleRoute>
          }
        />

        <Route
          path="/provider/dashboard"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderAdminDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/organizations"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderTenantOrgsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/catalog"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <CatalogPage isProviderGlobal />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/infrastructure"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderInfraTopologyPage />
            </RoleRoute>
          }
        />

        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </Page>
  );
};
