import { Route, Routes } from 'react-router-dom';
import { create } from '@bufbuild/protobuf';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { StorageBackendSchema } from '@osac/types/private';
import type { MockApiFixtures } from '@osac/ui-components/test-utils/createMockConnectTransport';
import { renderWithProviders } from '@osac/ui-components/test-utils/TestProviders';

import { StorageRoutes } from './StorageRoutes';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    // useBlocker requires a data router; this test harness renders under a
    // plain MemoryRouter, so StorageBackendCreatePage's LeaveFormConfirmation
    // is stubbed out here rather than exercised (see its own test file).
    useBlocker: () => ({ state: 'unblocked' as const }),
  };
});

const renderAt = (path: string, apiFixtures?: MockApiFixtures) =>
  renderWithProviders(
    <Routes>
      <Route path="/admin/infrastructure/storage/*" element={<StorageRoutes />} />
    </Routes>,
    { routerEntries: [path], apiFixtures },
  );

describe('StorageRoutes', () => {
  it('redirects the bare /admin/infrastructure/storage path to the Backends tab', () => {
    renderAt('/admin/infrastructure/storage');

    expect(screen.getByRole('button', { name: 'Create backend' })).toBeInTheDocument();
  });

  it('renders the real create form for backends/create', () => {
    renderAt('/admin/infrastructure/storage/backends/create');

    expect(screen.getByRole('heading', { name: 'Create storage backend' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  });

  it('renders the real edit form for backends/:id/edit', async () => {
    renderAt('/admin/infrastructure/storage/backends/abc-123/edit', {
      storageBackends: [
        create(StorageBackendSchema, {
          id: 'abc-123',
          metadata: { name: 'vast-prod-1' },
          spec: { provider: 'vast', endpoint: 'vast.example.com:443', description: '' },
        }),
      ],
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Edit storage backend' })).toBeInTheDocument();
    });
    expect(screen.getByRole('textbox', { name: 'Endpoint' })).toHaveValue('vast.example.com:443');
    expect(screen.queryByText('This feature is coming soon.')).not.toBeInTheDocument();
  });

  it('renders the Tiers tab at /admin/infrastructure/storage/tiers', async () => {
    renderAt('/admin/infrastructure/storage/tiers');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create tier' })).toBeInTheDocument();
    });
  });

  it('renders the create storage tier page for tiers/create', () => {
    renderAt('/admin/infrastructure/storage/tiers/create');

    expect(screen.getByRole('heading', { name: 'Create storage tier' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
    expect(screen.queryByText('This feature is coming soon.')).not.toBeInTheDocument();
  });

  it('renders a placeholder for tiers/:id/edit', () => {
    renderAt('/admin/infrastructure/storage/tiers/tier-123/edit');

    expect(screen.getByText('Edit storage tier')).toBeInTheDocument();
  });
});
