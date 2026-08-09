import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StorageManagementPage } from './StorageManagementPage';
import { renderWithProviders } from '../../test-utils/TestProviders';

const renderPage = (activeTab: 'backends' | 'tiers') =>
  renderWithProviders(
    <Routes>
      <Route
        path="/admin/storage/backends"
        element={<StorageManagementPage activeTab="backends" />}
      />
      <Route path="/admin/storage/tiers" element={<StorageManagementPage activeTab="tiers" />} />
    </Routes>,
    { routerEntries: [`/admin/storage/${activeTab}`] },
  );

describe('StorageManagementPage', () => {
  it('renders Backends and Tiers tabs', () => {
    renderPage('backends');

    expect(screen.getByRole('tab', { name: 'Backends' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tiers' })).toBeInTheDocument();
  });

  it('shows the Backends placeholder when activeTab is backends', () => {
    renderPage('backends');

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Storage backends');
  });

  it('shows the Tiers placeholder when activeTab is tiers', () => {
    renderPage('tiers');

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Storage tiers');
  });

  it('navigates to /admin/storage/tiers when the Tiers tab is clicked', async () => {
    const { user } = renderPage('backends');

    await user.click(screen.getByRole('tab', { name: 'Tiers' }));

    await waitFor(() => {
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Storage tiers');
    });
  });
});
