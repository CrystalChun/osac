import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@osac/ui-components/test-utils/TestProviders';

import { StorageRoutes } from './StorageRoutes';

const renderAt = (path: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/admin/infrastructure/storage/*" element={<StorageRoutes />} />
    </Routes>,
    { routerEntries: [path] },
  );

describe('StorageRoutes', () => {
  it('redirects the bare /admin/infrastructure/storage path to the Backends tab', () => {
    renderAt('/admin/infrastructure/storage');

    expect(screen.getByRole('button', { name: 'Create backend' })).toBeInTheDocument();
  });

  it('renders a placeholder for backends/create', () => {
    renderAt('/admin/infrastructure/storage/backends/create');

    expect(screen.getByText('Create storage backend')).toBeInTheDocument();
  });

  it('renders a placeholder for backends/:id/edit', () => {
    renderAt('/admin/infrastructure/storage/backends/abc-123/edit');

    expect(screen.getByText('Edit storage backend')).toBeInTheDocument();
  });

  it('renders the Tiers tab at /admin/infrastructure/storage/tiers', async () => {
    renderAt('/admin/infrastructure/storage/tiers');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create tier' })).toBeInTheDocument();
    });
  });

  it('renders a placeholder for tiers/create', () => {
    renderAt('/admin/infrastructure/storage/tiers/create');

    expect(screen.getByText('Create storage tier')).toBeInTheDocument();
  });

  it('renders a placeholder for tiers/:id/edit', () => {
    renderAt('/admin/infrastructure/storage/tiers/tier-123/edit');

    expect(screen.getByText('Edit storage tier')).toBeInTheDocument();
  });
});
