import { Route, Routes } from 'react-router-dom';
import { create } from '@bufbuild/protobuf';
import { Code, ConnectError } from '@connectrpc/connect';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  StorageBackendSchema,
  type StorageBackendsUpdateRequest,
  StorageBackendsUpdateResponseSchema,
} from '@osac/types/private';

import { StorageBackendEditPage } from './StorageBackendEditPage';
import type {
  MockApiFixtures,
  MockTransportOverrides,
} from '../../test-utils/createMockConnectTransport';
import { renderWithProviders } from '../../test-utils/TestProviders';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    // useBlocker requires a data router; this test harness renders under a plain
    // MemoryRouter, so LeaveFormConfirmation's blocking behavior is stubbed out
    // rather than exercised here (mirrors StorageBackendCreatePage.test.tsx).
    useBlocker: () => ({ state: 'unblocked' as const }),
  };
});

const EDIT_ROUTE_PATH = '/admin/infrastructure/storage/backends/:id/edit';
const EDIT_PATH = '/admin/infrastructure/storage/backends/b-1/edit';

const existingBackend = create(StorageBackendSchema, {
  id: 'b-1',
  metadata: { name: 'vast-prod-1', version: 7 },
  spec: {
    provider: 'vast',
    endpoint: 'vast.example.com:443',
    description: 'primary array',
    credentials: { username: 'existing-admin', password: 'existing-secret' },
  },
});

const renderPage = (overrides?: MockTransportOverrides, apiFixtures?: MockApiFixtures) =>
  renderWithProviders(
    <Routes>
      <Route path={EDIT_ROUTE_PATH} element={<StorageBackendEditPage />} />
    </Routes>,
    {
      routerEntries: [EDIT_PATH],
      apiFixtures: { storageBackends: [existingBackend], ...apiFixtures },
      transportOverrides: overrides,
    },
  );

describe('StorageBackendEditPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('shows a loading spinner before the backend has been fetched', () => {
    renderPage();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders the page prefilled with the backend endpoint and description', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Edit storage backend' })).toBeInTheDocument();
    });
    expect(screen.getByRole('textbox', { name: 'Endpoint' })).toHaveValue('vast.example.com:443');
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('primary array');
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('vast-prod-1');
    expect(screen.getByLabelText(/^Provider/)).toHaveTextContent('VAST');
  });

  it('renders name and provider as disabled', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
    });
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled();
    expect(screen.getByLabelText(/^Provider/)).toBeDisabled();
  });

  it('renders credential fields blank regardless of the fetched record', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/^Username/)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^Username/)).toHaveValue('');
    expect(screen.getByLabelText(/^Password/)).toHaveValue('');
  });

  it('shows a validation error and does not submit when only username is filled', async () => {
    const onStorageBackendUpdate = vi.fn();
    const { user } = renderPage({ onStorageBackendUpdate });

    await waitFor(() => {
      expect(screen.getByLabelText(/^Username/)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/^Username/), 'new-admin');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(
        screen.getAllByText('Enter both username and password, or leave both blank').length,
      ).toBeGreaterThan(0);
    });
    expect(onStorageBackendUpdate).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows a validation error and does not submit when only password is filled', async () => {
    const onStorageBackendUpdate = vi.fn();
    const { user } = renderPage({ onStorageBackendUpdate });

    await waitFor(() => {
      expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/^Password/), 'new-secret');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(
        screen.getAllByText('Enter both username and password, or leave both blank').length,
      ).toBeGreaterThan(0);
    });
    expect(onStorageBackendUpdate).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('omits credentials and never submits name/provider when both credential fields are left blank', async () => {
    let capturedRequest: StorageBackendsUpdateRequest | undefined;
    const { user } = renderPage({
      onStorageBackendUpdate: (req) => {
        capturedRequest = req;
        return create(StorageBackendsUpdateResponseSchema, { object: existingBackend });
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Endpoint' })).toHaveValue('vast.example.com:443');
    });
    await user.clear(screen.getByRole('textbox', { name: 'Endpoint' }));
    await user.type(screen.getByRole('textbox', { name: 'Endpoint' }), 'new.example.com:443');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/infrastructure/storage/backends');
    });
    expect(capturedRequest?.object?.spec?.endpoint).toBe('new.example.com:443');
    expect(capturedRequest?.object?.spec?.credentials).toBeUndefined();
    expect(capturedRequest?.object?.metadata?.name).toBe('');
    expect(capturedRequest?.updateMask?.paths).not.toContain('spec.provider');
    expect(capturedRequest?.updateMask?.paths).not.toContain('metadata.name');
    expect(capturedRequest?.updateMask?.paths).not.toContain('spec.credentials');
    expect(capturedRequest?.lock).toBe(true);
    expect(capturedRequest?.object?.metadata?.version).toBe(7);
  });

  it('submits a complete credentials object when both fields are filled', async () => {
    let capturedRequest: StorageBackendsUpdateRequest | undefined;
    const { user } = renderPage({
      onStorageBackendUpdate: (req) => {
        capturedRequest = req;
        return create(StorageBackendsUpdateResponseSchema, { object: existingBackend });
      },
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/^Username/)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/^Username/), 'new-admin');
    await user.type(screen.getByLabelText(/^Password/), 'new-secret');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/infrastructure/storage/backends');
    });
    expect(capturedRequest?.object?.spec?.credentials).toMatchObject({
      username: 'new-admin',
      password: 'new-secret',
    });
  });

  it('shows a submission error and does not navigate on a stale-version conflict', async () => {
    const { user } = renderPage({
      onStorageBackendUpdate: () => {
        throw new ConnectError('Storage backend was modified by another request', Code.Aborted);
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Endpoint' })).toHaveValue('vast.example.com:443');
    });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to update storage backend')).toBeInTheDocument();
    });
    expect(screen.getByText('Storage backend was modified by another request')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows a not-found error and no form when the backend does not exist', async () => {
    renderPage(undefined, { storageBackends: [] });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch storage backend')).toBeInTheDocument();
    });
    expect(screen.getByText('Storage backend not found')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Endpoint' })).not.toBeInTheDocument();
  });

  it('navigates back to the backends list on cancel', async () => {
    const { user } = renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockNavigate).toHaveBeenCalledWith('/admin/infrastructure/storage/backends');
  });
});
