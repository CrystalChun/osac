import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@osac/ui-components/test-utils/TestProviders';

import { StorageRoutes } from './StorageRoutes';

const renderAt = (path: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/admin/storage/*" element={<StorageRoutes />} />
    </Routes>,
    { routerEntries: [path] },
  );

describe('StorageRoutes', () => {
  it('redirects the bare /admin/storage path to the Backends tab', () => {
    renderAt('/admin/storage');

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Storage backends');
  });

  it('renders a placeholder for backends/create', () => {
    renderAt('/admin/storage/backends/create');

    expect(screen.getByText('Create storage backend')).toBeInTheDocument();
  });

  it('renders a placeholder for backends/:id/edit', () => {
    renderAt('/admin/storage/backends/abc-123/edit');

    expect(screen.getByText('Edit storage backend')).toBeInTheDocument();
  });

  it('renders the Tiers tab at /admin/storage/tiers', async () => {
    renderAt('/admin/storage/tiers');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create tier' })).toBeInTheDocument();
    });
  });

  it('renders a placeholder for tiers/create', () => {
    renderAt('/admin/storage/tiers/create');

    expect(screen.getByText('Create storage tier')).toBeInTheDocument();
  });

  it('renders a placeholder for tiers/:id/edit', () => {
    renderAt('/admin/storage/tiers/tier-123/edit');

    expect(screen.getByText('Edit storage tier')).toBeInTheDocument();
  });
});
