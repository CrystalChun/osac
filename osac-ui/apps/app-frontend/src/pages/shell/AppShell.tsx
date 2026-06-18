import { type ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Page } from '@patternfly/react-core';

import ErrorBoundary from '@osac/ui-components/components/ErrorBoundary/ErrorBoundary';
import { VmDetailsPage } from '@osac/ui-components/components/vm/VmDetailsPage';
import { useSession } from '@osac/ui-components/hooks/use-session';
import type { DemoShellRole } from '@osac/ui-components/shellTypes';

import { ShellMasthead } from './ShellMasthead';
import { defaultRouteForRole } from './shellRoutes';
import { ShellSidebar } from './ShellSidebar';
import { AdminDashboardPage } from '../admin/AdminDashboardPage';
import { AdminNetworksPage } from '../admin/AdminNetworksPage';
import { AdminUsersPage } from '../admin/AdminUsersPage';
import { ProviderAdminDashboardPage } from '../provider/ProviderAdminDashboardPage';
import { ProviderInfraTopologyPage } from '../provider/ProviderInfraTopologyPage';
import { ProviderTenantOrgsPage } from '../provider/ProviderTenantOrgsPage';
import { CatalogPage } from '../tenant/CatalogPage';
import { ClusterRoutes } from '../tenant/ClusterRoutes';
import { VmCreatePage } from '../tenant/VmCreatePage';
import { VmListPage } from '../tenant/VmListPage';

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
