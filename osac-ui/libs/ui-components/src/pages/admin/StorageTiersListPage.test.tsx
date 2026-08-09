import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { StorageBackend, StorageTier } from '@osac/types/private';
import { StorageBackendState, StorageProtocol, StorageTierState } from '@osac/types/private';

import { StorageTiersListPage } from './StorageTiersListPage';
import { storageBackendIdsFilter } from '../../api/v1/private/storage-backends';
import { renderWithProviders } from '../../test-utils/TestProviders';

const makeBackend = (id: string, name: string): StorageBackend =>
  ({
    id,
    metadata: { name },
    spec: { provider: 'vast', endpoint: `${id}.example.com`, credentials: {} },
    status: { state: StorageBackendState.READY },
  }) as StorageBackend;

const makeTier = (
  id: string,
  name: string,
  backends: { backendId: string; protocol: StorageProtocol }[],
): StorageTier =>
  ({
    id,
    metadata: { name },
    spec: {
      description: '',
      backends: backends.map((b) => ({
        backendId: b.backendId,
        protocol: b.protocol,
        maxReadBandwidthMbs: 0,
        maxWriteBandwidthMbs: 0,
        quotaGib: BigInt(0),
        encryptionEnabled: false,
      })),
    },
    status: { state: StorageTierState.ACTIVE },
  }) as StorageTier;

const backendA = makeBackend('backend-a', 'Fast NVMe');
const backendB = makeBackend('backend-b', 'Bulk HDD');
const backendUnused = makeBackend('backend-unused', 'Unused Backend');

const singleBackendTier = makeTier('tier-1', 'fast', [
  { backendId: 'backend-a', protocol: StorageProtocol.NFS },
]);
const mixedTier = makeTier('tier-2', 'mixed', [
  { backendId: 'backend-b', protocol: StorageProtocol.BLOCK },
  { backendId: 'missing-backend', protocol: StorageProtocol.NFS },
]);

const defaultTiers = [singleBackendTier, mixedTier];
const defaultBackends = [backendA, backendB, backendUnused];

const renderPage = (
  tiers: StorageTier[] = defaultTiers,
  backends: StorageBackend[] = defaultBackends,
) =>
  renderWithProviders(<StorageTiersListPage />, {
    apiFixtures: { storageTiers: tiers, storageBackends: backends },
  });

describe('StorageTiersListPage', () => {
  it('renders tier rows with name, resolved backend names, and protocols', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('fast')).toBeInTheDocument();
    });
    expect(screen.getByText('Fast NVMe')).toBeInTheDocument();
    expect(screen.getByText('NFS')).toBeInTheDocument();
  });

  it('renders comma-separated backend names and protocols for a tier with multiple backend associations, falling back to the raw id when a backend cannot be resolved', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('mixed')).toBeInTheDocument();
    });
    expect(screen.getByText('Bulk HDD, missing-backend')).toBeInTheDocument();
    expect(screen.getByText('Block, NFS')).toBeInTheDocument();
  });

  it('renders the STATE column via StorageTierStatusLabel', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Active')).toHaveLength(2);
    });
  });

  it('requests exactly the set of backend ids referenced by the rendered tiers, not every registered backend', async () => {
    let capturedFilter: string | undefined;

    renderWithProviders(<StorageTiersListPage />, {
      apiFixtures: { storageTiers: defaultTiers, storageBackends: defaultBackends },
      transportOverrides: {
        onStorageBackendList: (req) => {
          capturedFilter = req.filter;
          return {
            items: defaultBackends,
            size: defaultBackends.length,
            total: defaultBackends.length,
          };
        },
      },
    });

    await waitFor(() => {
      expect(capturedFilter).toBeDefined();
    });

    const expectedIds = ['backend-a', 'backend-b', 'missing-backend'].sort();
    expect(capturedFilter).toBe(storageBackendIdsFilter(expectedIds));
  });

  it('shows the empty state and no table when there are no tiers', async () => {
    renderPage([], []);

    await waitFor(() => {
      expect(
        screen.getByText('No storage tiers yet. Create one to get started.'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('navigates to the create route when Create tier is clicked', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/admin/storage/tiers" element={<StorageTiersListPage />} />
        <Route path="/admin/storage/tiers/create" element={<div>navigated-to-create</div>} />
      </Routes>,
      {
        apiFixtures: { storageTiers: defaultTiers, storageBackends: defaultBackends },
        routerEntries: ['/admin/storage/tiers'],
      },
    );

    await waitFor(() => {
      expect(screen.getByText('fast')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Create tier' }));

    await waitFor(() => {
      expect(screen.getByText('navigated-to-create')).toBeInTheDocument();
    });
  });

  it('navigates to the edit route when a row Edit action is clicked', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/admin/storage/tiers" element={<StorageTiersListPage />} />
        <Route path="/admin/storage/tiers/:id/edit" element={<div>navigated-to-edit</div>} />
      </Routes>,
      {
        apiFixtures: { storageTiers: defaultTiers, storageBackends: defaultBackends },
        routerEntries: ['/admin/storage/tiers'],
      },
    );

    await waitFor(() => {
      expect(screen.getByText('fast')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Actions for fast' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

    await waitFor(() => {
      expect(screen.getByText('navigated-to-edit')).toBeInTheDocument();
    });
  });

  it('removes the row from the table when delete succeeds', async () => {
    let tiers = [...defaultTiers];
    const { user } = renderWithProviders(<StorageTiersListPage />, {
      apiFixtures: { storageBackends: defaultBackends },
      transportOverrides: {
        onStorageTierList: () => ({ items: tiers, size: tiers.length, total: tiers.length }),
        onStorageTierDelete: (req) => {
          tiers = tiers.filter((tier) => tier.id !== req.id);
          return {};
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('fast')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Actions for fast' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: /^Delete$/i }));

    await waitFor(() => {
      expect(screen.queryByText('fast')).not.toBeInTheDocument();
    });
    expect(screen.getByText('mixed')).toBeInTheDocument();
  });
});
