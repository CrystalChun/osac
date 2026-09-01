import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SessionProvider } from '@osac/ui-components/hooks/use-session';
import { renderWithProviders } from '@osac/ui-components/test-utils/TestProviders';

vi.mock('./StorageRoutes', () => ({
  StorageRoutes: () => <h1>Storage routes</h1>,
}));

import { AppShell } from './AppShell';

const renderAppShell = (entry: string) =>
  renderWithProviders(
    <SessionProvider role="admin" username="test-admin" tenantId="tenant-1">
      <AppShell logout={vi.fn().mockResolvedValue(undefined)} />
    </SessionProvider>,
    {
      apiFixtures: { privateInstanceTypes: [], privateBaremetalInstanceTypes: [] },
      routerEntries: [entry],
    },
  );

describe('AppShell', () => {
  it('renders the storage route through the admin shell', () => {
    renderAppShell('/admin/infrastructure/storage/backends');

    expect(screen.getByRole('heading', { name: 'Storage routes' })).toBeInTheDocument();
  });

  it('renders the instance type list route through the admin shell', async () => {
    renderAppShell('/admin/infrastructure/instance-types');

    expect(screen.getByRole('heading', { name: 'Instance types' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('No instance types yet.')).toBeInTheDocument();
    });
  });

  it('renders the instance type create shell through the admin shell', () => {
    renderAppShell('/admin/infrastructure/instance-types/create');

    expect(screen.getByRole('heading', { name: 'Create instance type' })).toBeInTheDocument();
  });

  it('renders the bare metal instance type list route through the admin shell', async () => {
    renderAppShell('/admin/infrastructure/baremetal-instance-types');

    expect(screen.getByRole('heading', { name: 'Bare metal instance types' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('No bare metal instance types yet.')).toBeInTheDocument();
    });
  });
});
