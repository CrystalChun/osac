/**
 * flow: application-shell-session
 * step: shell_primary_workspace
 *
 * Authenticated application shell — masthead, sidebar nav (role-based).
 */
import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { DemoShellRole } from '@osac/api-contracts/types';
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Page,
} from '@patternfly/react-core';

import { useSession } from '../../contexts/SessionContext';
import { getErrorMessage } from '@osac/ui-components/utils/error';

import { CatalogPage } from '../tenant/CatalogPage';
import { VmListPage } from '../tenant/VmListPage';
import { AdminDashboardPage } from '../admin/AdminDashboardPage';
import { AdminNetworksPage } from '../admin/AdminNetworksPage';
import { AdminUsersPage } from '../admin/AdminUsersPage';
import { ProviderAdminDashboardPage } from '../provider/ProviderAdminDashboardPage';
import { ProviderInfraTopologyPage } from '../provider/ProviderInfraTopologyPage';
import { ProviderTenantOrgsPage } from '../provider/ProviderTenantOrgsPage';
import { ShellMasthead } from './ShellMasthead';
import { ShellSidebar } from './ShellSidebar';
import { navRowsForRole } from './shellNav';
import { defaultRouteForRole } from './shellRoutes';
import { PAGE_CONTENT_PORTAL_HOST_ID } from './pageContentPortalHost';
import './AppShell.css';

const RoleRoute = ({
  allow,
  role,
  fallback,
  children,
}: {
  allow: DemoShellRole[];
  role: DemoShellRole;
  fallback: string;
  children: ReactElement;
}) => (allow.includes(role) ? children : <Navigate to={fallback} replace />);

export const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    selectedTenant,
    role,
    isDarkTheme,
    setIsDarkTheme,
    logout,
    openTopologyDetailRequest,
    username,
  } = useSession();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string>();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (err) {
      setLogoutError(getErrorMessage(err));
    }
  }, [logout]);

  const navRows = useMemo(() => navRowsForRole(role), [role]);
  const handleSidebarNavigate = useCallback(
    (path: string) => {
      const isReselect = path === location.pathname;
      navigate(path, {
        replace: isReselect,
        state: {
          navReselect: isReselect,
          navSelectSeq: Date.now(),
        },
      });
    },
    [location.pathname, navigate],
  );

  const displayName = useMemo(() => {
    if (username?.trim()) {
      return username.trim();
    }
    if (role === 'providerAdmin') {
      return 'Provider admin';
    }
    return 'Signed-in user';
  }, [role, username]);

  const defaultRoute = defaultRouteForRole(role);

  return (
    <>
      {logoutError && (
        <Modal variant="small" isOpen onClose={() => setLogoutError(undefined)}>
          <ModalHeader title="Logout failed" titleIconVariant="danger" />
          <ModalBody>
            <Alert variant="danger" isInline title={logoutError ?? ''} />
          </ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={() => setLogoutError(undefined)}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}
      <Page
        masthead={
          <ShellMasthead
            selectedTenant={selectedTenant}
            role={role}
            displayName={displayName}
            isUserMenuOpen={isUserMenuOpen}
            setIsUserMenuOpen={setIsUserMenuOpen}
            onLogout={handleLogout}
          />
        }
        sidebar={
          <ShellSidebar
            navRows={navRows}
            pathname={location.pathname}
            onNavigate={handleSidebarNavigate}
            isDarkTheme={isDarkTheme}
            setIsDarkTheme={setIsDarkTheme}
          />
        }
        isManagedSidebar
        isContentFilled
      >
        <div id={PAGE_CONTENT_PORTAL_HOST_ID} className="osac-page-content-root">
          <Routes>
            <Route path="/dashboard" element={<Navigate to="/vms" replace />} />
            <Route
              path="/vms/*"
              element={
                <RoleRoute
                  allow={['tenantUser', 'tenantAdmin']}
                  role={role}
                  fallback={defaultRoute}
                >
                  <VmListPage />
                </RoleRoute>
              }
            />
            <Route path="/templates" element={<Navigate to="/catalog" replace />} />
            <Route
              path="/catalog"
              element={
                <RoleRoute
                  allow={['tenantUser', 'tenantAdmin']}
                  role={role}
                  fallback={defaultRoute}
                >
                  <CatalogPage />
                </RoleRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <RoleRoute allow={['tenantAdmin']} role={role} fallback={defaultRoute}>
                  <AdminDashboardPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RoleRoute allow={['tenantAdmin']} role={role} fallback={defaultRoute}>
                  <AdminUsersPage />
                </RoleRoute>
              }
            />
            <Route path="/admin/templates" element={<Navigate to="/admin/catalog" replace />} />
            <Route
              path="/admin/catalog"
              element={
                <RoleRoute allow={['tenantAdmin']} role={role} fallback={defaultRoute}>
                  <CatalogPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/networks"
              element={
                <RoleRoute allow={['tenantAdmin']} role={role} fallback={defaultRoute}>
                  <AdminNetworksPage onOpenVmDetail={openTopologyDetailRequest} />
                </RoleRoute>
              }
            />

            <Route
              path="/provider/dashboard"
              element={
                <RoleRoute allow={['providerAdmin']} role={role} fallback={defaultRoute}>
                  <ProviderAdminDashboardPage />
                </RoleRoute>
              }
            />
            <Route
              path="/provider/organizations"
              element={
                <RoleRoute allow={['providerAdmin']} role={role} fallback={defaultRoute}>
                  <ProviderTenantOrgsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/provider/templates"
              element={<Navigate to="/provider/catalog" replace />}
            />
            <Route
              path="/provider/catalog"
              element={
                <RoleRoute allow={['providerAdmin']} role={role} fallback={defaultRoute}>
                  <CatalogPage isProviderGlobal />
                </RoleRoute>
              }
            />
            <Route
              path="/provider/infrastructure"
              element={
                <RoleRoute allow={['providerAdmin']} role={role} fallback={defaultRoute}>
                  <ProviderInfraTopologyPage />
                </RoleRoute>
              }
            />

            <Route path="*" element={<Navigate to={defaultRoute} replace />} />
          </Routes>
        </div>
      </Page>
    </>
  );
};
