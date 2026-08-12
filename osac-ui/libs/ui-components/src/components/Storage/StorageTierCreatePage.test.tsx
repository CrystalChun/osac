import { Code, ConnectError } from '@connectrpc/connect';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StorageBackend } from '@osac/types/private';
import { StorageBackendState, StorageProtocol } from '@osac/types/private';

import StorageTierCreatePage from './StorageTierCreatePage';
import { renderWithProviders } from '../../test-utils/TestProviders';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const readyBackend = {
  id: 'backend-1',
  metadata: { name: 'fast-nvme' },
  spec: { provider: 'vast', endpoint: 'vast.example.com' },
  status: { state: StorageBackendState.READY },
} as StorageBackend;

const notReadyBackend = {
  id: 'backend-2',
  metadata: { name: 'not-ready-backend' },
  spec: { provider: 'ceph', endpoint: 'ceph.example.com' },
  status: { state: StorageBackendState.UNSPECIFIED },
} as StorageBackend;

const fillValidForm = async (user: ReturnType<typeof renderWithProviders>['user']) => {
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'fast-tier');
  await user.click(screen.getByLabelText(/^Backend/));
  await user.click(screen.getByRole('option', { name: 'fast-nvme' }));
  await user.click(screen.getByRole('radio', { name: 'NFS' }));
  await user.type(screen.getByRole('spinbutton', { name: 'Max read bandwidth (MB/s)' }), '100');
  await user.type(screen.getByRole('spinbutton', { name: 'Max write bandwidth (MB/s)' }), '80');
  await user.type(screen.getByRole('spinbutton', { name: 'Quota (GiB)' }), '500');
};

describe('StorageTierCreatePage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders the page title, fields, and actions', () => {
    renderWithProviders(<StorageTierCreatePage />, {
      apiFixtures: { storageBackends: [readyBackend] },
    });

    expect(screen.getByRole('heading', { name: 'Create storage tier' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Description' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Backend/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'NFS' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Block' })).toBeInTheDocument();
    expect(
      screen.getByRole('spinbutton', { name: 'Max read bandwidth (MB/s)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('spinbutton', { name: 'Max write bandwidth (MB/s)' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Quota (GiB)' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Encryption enabled' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('does not render an add-another-backend control', () => {
    renderWithProviders(<StorageTierCreatePage />, {
      apiFixtures: { storageBackends: [readyBackend] },
    });

    expect(screen.queryByRole('button', { name: /add.*backend/i })).not.toBeInTheDocument();
  });

  it('only offers READY backends as options', async () => {
    const { user } = renderWithProviders(<StorageTierCreatePage />, {
      apiFixtures: { storageBackends: [readyBackend, notReadyBackend] },
    });

    await user.click(screen.getByLabelText(/^Backend/));

    expect(screen.getByRole('option', { name: 'fast-nvme' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'not-ready-backend' })).not.toBeInTheDocument();
  });

  it('shows the loading placeholder while backends are loading', () => {
    renderWithProviders(<StorageTierCreatePage />, {
      apiFixtures: { storageBackends: [readyBackend] },
    });

    expect(screen.getByLabelText(/^Backend/)).toHaveTextContent('Loading...');
  });

  it('offers no selectable backends when none are READY', async () => {
    const { user } = renderWithProviders(<StorageTierCreatePage />, {
      apiFixtures: { storageBackends: [notReadyBackend] },
    });

    await user.click(screen.getByLabelText(/^Backend/));

    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('rejects a value over the int32 maximum for a bandwidth field', async () => {
    const { user } = renderWithProviders(<StorageTierCreatePage />, {
      apiFixtures: { storageBackends: [readyBackend] },
    });

    await user.type(
      screen.getByRole('spinbutton', { name: 'Max read bandwidth (MB/s)' }),
      '9999999999',
    );
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Must be at most 2147483647')).toBeInTheDocument();
    });
  });

  it('rejects a quota above Number.MAX_SAFE_INTEGER to avoid silent float rounding', async () => {
    const { user } = renderWithProviders(<StorageTierCreatePage />, {
      apiFixtures: { storageBackends: [readyBackend] },
    });

    await user.type(screen.getByRole('spinbutton', { name: 'Quota (GiB)' }), '9007199254740993');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Must be at most 9007199254740991')).toBeInTheDocument();
    });
  });

  it('rejects a name that is not a valid DNS label', async () => {
    const { user } = renderWithProviders(<StorageTierCreatePage />, {
      apiFixtures: { storageBackends: [readyBackend] },
    });

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Invalid_Name');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Name must only contain lowercase letters (a-z), digits (0-9), and hyphens (-)',
        ),
      ).toBeInTheDocument();
    });
  });

  it('rejects a non-positive value for a QoS field', async () => {
    const { user } = renderWithProviders(<StorageTierCreatePage />, {
      apiFixtures: { storageBackends: [readyBackend] },
    });

    await user.type(screen.getByRole('spinbutton', { name: 'Max read bandwidth (MB/s)' }), '0');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Must be greater than zero')).toBeInTheDocument();
    });
  });

  it('converts a scientific-notation quota to a plain bigint without throwing', async () => {
    const onStorageTierCreate = vi.fn(
      (req: { object?: { metadata?: unknown; spec?: unknown } }) => ({
        object: {
          id: 'new-tier-1',
          metadata: req.object?.metadata,
          spec: req.object?.spec,
          status: { state: 0 },
        },
      }),
    );

    const { user } = renderWithProviders(<StorageTierCreatePage />, {
      apiFixtures: { storageBackends: [readyBackend] },
      transportOverrides: { onStorageTierCreate: onStorageTierCreate as never },
    });

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'fast-tier');
    await user.click(screen.getByLabelText(/^Backend/));
    await user.click(screen.getByRole('option', { name: 'fast-nvme' }));
    await user.click(screen.getByRole('radio', { name: 'NFS' }));
    await user.type(screen.getByRole('spinbutton', { name: 'Max read bandwidth (MB/s)' }), '100');
    await user.type(screen.getByRole('spinbutton', { name: 'Max write bandwidth (MB/s)' }), '80');
    await user.type(screen.getByRole('spinbutton', { name: 'Quota (GiB)' }), '1e2');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(onStorageTierCreate).toHaveBeenCalledTimes(1);
    });

    const backends = (
      onStorageTierCreate.mock.calls[0][0].object?.spec as { backends?: { quotaGib?: bigint }[] }
    )?.backends;
    expect(backends?.[0].quotaGib).toBe(100n);
  });

  it('submits spec.backends as a one-element array and navigates on success', async () => {
    const onStorageTierCreate = vi.fn(
      (req: { object?: { metadata?: unknown; spec?: unknown } }) => ({
        object: {
          id: 'new-tier-1',
          metadata: req.object?.metadata,
          spec: req.object?.spec,
          status: { state: 0 },
        },
      }),
    );

    const { user } = renderWithProviders(<StorageTierCreatePage />, {
      apiFixtures: { storageBackends: [readyBackend] },
      transportOverrides: { onStorageTierCreate: onStorageTierCreate as never },
    });

    await fillValidForm(user);
    await user.click(screen.getByRole('checkbox', { name: 'Encryption enabled' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(onStorageTierCreate).toHaveBeenCalledTimes(1);
    });

    const request = onStorageTierCreate.mock.calls[0][0];
    expect(request.object?.metadata).toMatchObject({ name: 'fast-tier' });
    const backends = (request.object?.spec as { backends?: unknown[] })?.backends;
    expect(Array.isArray(backends)).toBe(true);
    expect(backends).toHaveLength(1);
    expect(backends?.[0]).toMatchObject({
      backendId: 'backend-1',
      protocol: StorageProtocol.NFS,
      maxReadBandwidthMbs: 100,
      maxWriteBandwidthMbs: 80,
      quotaGib: 500n,
      encryptionEnabled: true,
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/infrastructure/storage/tiers');
    });
  });

  it('shows the ALREADY_EXISTS error as a form-level error without navigating away', async () => {
    const { user } = renderWithProviders(<StorageTierCreatePage />, {
      apiFixtures: { storageBackends: [readyBackend] },
      transportOverrides: {
        onStorageTierCreate: () => {
          throw new ConnectError('Storage tier name already exists', Code.AlreadyExists);
        },
      },
    });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Storage tier name already exists')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows the NOT_FOUND error as a form-level error without navigating away', async () => {
    const { user } = renderWithProviders(<StorageTierCreatePage />, {
      apiFixtures: { storageBackends: [readyBackend] },
      transportOverrides: {
        onStorageTierCreate: () => {
          throw new ConnectError('Storage backend backend-1 not found', Code.NotFound);
        },
      },
    });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Storage backend backend-1 not found')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
