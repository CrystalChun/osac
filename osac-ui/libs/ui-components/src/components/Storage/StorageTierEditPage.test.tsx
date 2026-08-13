import { Route, Routes } from 'react-router-dom';
import { Code, ConnectError } from '@connectrpc/connect';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StorageBackend, StorageTier } from '@osac/types/private';
import { StorageBackendState, StorageProtocol, StorageTierState } from '@osac/types/private';

import StorageTierEditPage from './StorageTierEditPage';
import {
  type RenderWithProvidersOptions,
  renderWithProviders,
} from '../../test-utils/TestProviders';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    // useBlocker requires a data router; this test harness renders under a plain
    // MemoryRouter, so LeaveFormConfirmation's blocking behavior is stubbed out
    // rather than exercised here (see StorageTierCreatePage.test.tsx for the
    // same pattern).
    useBlocker: () => ({ state: 'unblocked' as const }),
  };
});

const readyBackend = {
  id: 'backend-1',
  metadata: { name: 'fast-nvme' },
  spec: { provider: 'vast', endpoint: 'vast.example.com' },
  status: { state: StorageBackendState.READY },
} as StorageBackend;

const assignedNonReadyBackend = {
  id: 'backend-2',
  metadata: { name: 'legacy-backend' },
  spec: { provider: 'ceph', endpoint: 'ceph.example.com' },
  status: { state: StorageBackendState.UNSPECIFIED },
} as StorageBackend;

const tier = {
  id: 'tier-1',
  metadata: { name: 'fast-tier', version: 5 },
  spec: {
    description: 'fast storage',
    backends: [
      {
        backendId: 'backend-2',
        protocol: StorageProtocol.NFS,
        maxReadBandwidthMbs: 100,
        maxWriteBandwidthMbs: 80,
        quotaGib: 500n,
        encryptionEnabled: false,
      },
    ],
  },
  status: { state: StorageTierState.ACTIVE },
} as StorageTier;

const renderEditPage = (options: RenderWithProvidersOptions = {}) =>
  renderWithProviders(
    <Routes>
      <Route
        path="/admin/infrastructure/storage/tiers/:id/edit"
        element={<StorageTierEditPage />}
      />
    </Routes>,
    {
      routerEntries: ['/admin/infrastructure/storage/tiers/tier-1/edit'],
      apiFixtures: {
        storageTiers: [tier],
        storageBackends: [readyBackend, assignedNonReadyBackend],
      },
      ...options,
    },
  );

describe('StorageTierEditPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('pre-fills the form with the tier’s current values', async () => {
    renderEditPage();

    expect(await screen.findByRole('textbox', { name: 'Name' })).toHaveValue('fast-tier');
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('fast storage');
    expect(screen.getByLabelText(/^Backend/)).toHaveTextContent('legacy-backend');
    expect(screen.getByRole('radio', { name: 'NFS' })).toBeChecked();
    expect(screen.getByRole('spinbutton', { name: 'Max read bandwidth (MB/s)' })).toHaveValue(100);
    expect(screen.getByRole('spinbutton', { name: 'Max write bandwidth (MB/s)' })).toHaveValue(80);
    expect(screen.getByRole('spinbutton', { name: 'Quota (GiB)' })).toHaveValue(500);
    expect(screen.getByRole('checkbox', { name: 'Encryption enabled' })).not.toBeChecked();
  });

  it('renders the name field disabled', async () => {
    renderEditPage();

    expect(await screen.findByRole('textbox', { name: 'Name' })).toBeDisabled();
  });

  it('includes the tier’s own non-READY currently-assigned backend in the picker', async () => {
    const { user } = renderEditPage();

    await user.click(await screen.findByLabelText(/^Backend/));

    expect(screen.getByRole('option', { name: 'fast-nvme' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'legacy-backend' })).toBeInTheDocument();
  });

  it('does not show the QoS-change alert when only description changes', async () => {
    const { user } = renderEditPage();

    const descriptionInput = await screen.findByRole('textbox', { name: 'Description' });
    expect(screen.queryByText(/StorageClass/)).not.toBeInTheDocument();

    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'updated description');

    expect(screen.queryByText(/StorageClass/)).not.toBeInTheDocument();
  });

  it('shows the QoS-change alert when a QoS field changes', async () => {
    const { user } = renderEditPage();

    const quotaInput = await screen.findByRole('spinbutton', { name: 'Quota (GiB)' });
    await user.clear(quotaInput);
    await user.type(quotaInput, '999');

    expect(screen.getByText(/StorageClass/)).toBeInTheDocument();
  });

  it('submits spec.backends and spec.description together when the description changes', async () => {
    const onStorageTierUpdate = vi.fn(
      (req: { object?: { metadata?: unknown; spec?: unknown } }) => ({
        object: { ...tier, spec: { ...tier.spec, ...(req.object?.spec as object) } },
      }),
    );
    const { user } = renderEditPage({
      transportOverrides: { onStorageTierUpdate: onStorageTierUpdate as never },
    });

    const descriptionInput = await screen.findByRole('textbox', { name: 'Description' });
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'updated description');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onStorageTierUpdate).toHaveBeenCalledTimes(1));
    const request = onStorageTierUpdate.mock.calls[0][0] as {
      object?: { spec?: { description?: string; backends?: unknown }; metadata?: unknown };
      updateMask?: { paths?: string[] };
      lock?: boolean;
    };
    expect(request.object?.spec?.description).toBe('updated description');
    expect(request.object?.spec?.backends).toMatchObject([{ backendId: 'backend-2' }]);
    expect(request.updateMask?.paths).toEqual(['spec.backends', 'spec.description']);
    expect(request.lock).toBe(true);
    expect(request.object?.metadata).toMatchObject({ version: 5 });

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/admin/infrastructure/storage/tiers'),
    );
  });

  it('submits the complete spec.backends array, masked to spec.backends only, when a backend field changes', async () => {
    const onStorageTierUpdate = vi.fn((_req: { object?: unknown; updateMask?: unknown }) => ({
      object: { ...tier },
    }));
    const { user } = renderEditPage({
      transportOverrides: { onStorageTierUpdate: onStorageTierUpdate as never },
    });

    const quotaInput = await screen.findByRole('spinbutton', { name: 'Quota (GiB)' });
    await user.clear(quotaInput);
    await user.type(quotaInput, '999');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onStorageTierUpdate).toHaveBeenCalledTimes(1));
    const request = onStorageTierUpdate.mock.calls[0][0] as {
      object?: { spec?: { backends?: unknown } };
      updateMask?: { paths?: string[] };
    };
    expect(request.updateMask?.paths).toEqual(['spec.backends']);
    expect(request.object?.spec?.backends).toMatchObject([
      {
        backendId: 'backend-2',
        protocol: StorageProtocol.NFS,
        maxReadBandwidthMbs: 100,
        maxWriteBandwidthMbs: 80,
        quotaGib: 999n,
        encryptionEnabled: false,
      },
    ]);
  });

  it('submits the complete spec.backends array with update_mask ["spec.backends"] even when nothing changed', async () => {
    const onStorageTierUpdate = vi.fn((_req: { object?: unknown; updateMask?: unknown }) => ({
      object: { ...tier },
    }));
    const { user } = renderEditPage({
      transportOverrides: { onStorageTierUpdate: onStorageTierUpdate as never },
    });

    await screen.findByRole('textbox', { name: 'Description' });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onStorageTierUpdate).toHaveBeenCalledTimes(1));
    const request = onStorageTierUpdate.mock.calls[0][0] as {
      object?: { spec?: { backends?: unknown; description?: unknown } };
      updateMask?: { paths?: string[] };
    };
    expect(request.updateMask?.paths).toEqual(['spec.backends']);
    expect(request.object?.spec?.backends).toMatchObject([{ backendId: 'backend-2' }]);
  });

  it('shows a stale-version conflict as a submission error without navigating', async () => {
    const { user } = renderEditPage({
      transportOverrides: {
        onStorageTierUpdate: () => {
          throw new ConnectError(
            'Storage tier has been modified since it was read',
            Code.FailedPrecondition,
          );
        },
      },
    });

    const descriptionInput = await screen.findByRole('textbox', { name: 'Description' });
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'updated description');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(
        screen.getByText('Storage tier has been modified since it was read'),
      ).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
