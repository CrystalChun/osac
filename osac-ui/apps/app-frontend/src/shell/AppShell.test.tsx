import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SessionProvider } from '@osac/ui-components/hooks/use-session';
import type { UserRole } from '@osac/ui-components/shellTypes';
import { renderWithProviders } from '@osac/ui-components/test-utils/TestProviders';

vi.mock('./StorageRoutes', () => ({
  StorageRoutes: () => <h1>Storage routes</h1>,
}));

import { AppShell } from './AppShell';

const renderAppShell = (entry: string, role: UserRole = 'admin') =>
  renderWithProviders(
    <SessionProvider role={role} username="test-user" tenantId="tenant-1">
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

  it('redirects admin away from VM create to VM list', () => {
    renderAppShell('/vms/create', 'admin');

    expect(screen.queryByRole('heading', { name: /create virtual machine/i })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Virtual machines' })).toBeInTheDocument();
  });

  it('redirects admin away from cluster create to cluster list', () => {
    renderAppShell('/clusters/create', 'admin');

    expect(screen.queryByRole('heading', { name: /create cluster/i })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Clusters' })).toBeInTheDocument();
  });

  it('redirects admin away from bare metal create to bare metal list', () => {
    renderAppShell('/bare-metal/create', 'admin');

    expect(screen.queryByRole('heading', { name: /provision bare metal/i })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Bare Metal' })).toBeInTheDocument();
  });
});
