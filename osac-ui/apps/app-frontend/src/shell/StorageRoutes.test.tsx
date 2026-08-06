import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
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

  it('renders the Tiers tab at /admin/storage/tiers', () => {
    renderAt('/admin/storage/tiers');

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Storage tiers');
  });
});
