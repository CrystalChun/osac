import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import i18n from 'i18next';
import { describe, expect, it } from 'vitest';

import { isAdminRole } from '@osac/ui-components/helpers/isAdminRole';
import { SessionProvider } from '@osac/ui-components/hooks/use-session';
import type { DemoShellRole } from '@osac/ui-components/shellTypes';

import { ProviderCatalogRoutes } from './ProviderCatalogRoutes';
import { TenantAdminCatalogRoutes } from './TenantAdminCatalogRoutes';

const createTestI18n = () => {
  const instance = i18n.createInstance();
  instance.init({
    initImmediate: false,
    lng: 'en',
    fallbackLng: 'en',
    resources: { en: { translation: {} } },
    interpolation: { escapeValue: false },
  });
  return instance;
};

const renderWithRole = (role: DemoShellRole, route = '/admin/catalog') =>
  render(
    <I18nextProvider i18n={createTestI18n()}>
      <MemoryRouter initialEntries={[route]}>
        <SessionProvider role={role} username="test-user">
          <Routes>
            {isAdminRole(role) && (
              <Route
                path="/admin/catalog/*"
                element={
                  role === 'providerAdmin' ? (
                    <ProviderCatalogRoutes />
                  ) : (
                    <TenantAdminCatalogRoutes />
                  )
                }
              />
            )}
            <Route path="*" element={<div>default page</div>} />
          </Routes>
        </SessionProvider>
      </MemoryRouter>
    </I18nextProvider>,
  );

describe('Admin catalog routes', () => {
  it('renders provider catalog routes for providerAdmin', () => {
    renderWithRole('providerAdmin');
    expect(screen.getByRole('heading', { name: 'Catalog management' })).toBeInTheDocument();
  });

  it('renders tenant admin catalog routes for tenantAdmin', () => {
    renderWithRole('tenantAdmin');
    expect(screen.getByRole('heading', { name: 'Catalog management' })).toBeInTheDocument();
  });

  it('does not render admin routes for tenantUser', () => {
    renderWithRole('tenantUser');
    expect(screen.queryByRole('heading', { name: 'Catalog management' })).not.toBeInTheDocument();
    expect(screen.getByText('default page')).toBeInTheDocument();
  });
});
