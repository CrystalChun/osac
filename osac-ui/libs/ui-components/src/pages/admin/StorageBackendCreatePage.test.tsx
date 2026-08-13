import { create } from '@bufbuild/protobuf';
import { Code, ConnectError } from '@connectrpc/connect';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type StorageBackendsCreateRequest,
  type StorageBackendsCreateResponse,
  StorageBackendsCreateResponseSchema,
} from '@osac/types/private';

import { StorageBackendCreatePage } from './StorageBackendCreatePage';
import type { MockTransportOverrides } from '../../test-utils/createMockConnectTransport';
import { renderWithProviders } from '../../test-utils/TestProviders';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    // useBlocker requires a data router; this test harness renders under a plain
    // MemoryRouter, so LeaveFormConfirmation's blocking behavior is stubbed out
    // rather than exercised here (its only other caller has no test coverage
    // for it either).
    useBlocker: () => ({ state: 'unblocked' as const }),
  };
});

const testBackendPassword = 'test-password';

const renderPage = (overrides?: MockTransportOverrides) =>
  renderWithProviders(<StorageBackendCreatePage />, {
    transportOverrides: overrides,
  });

describe('StorageBackendCreatePage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  const fillValidForm = async (user: ReturnType<typeof renderPage>['user']) => {
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'vast-prod-1');
    await user.click(screen.getByLabelText(/^Provider/));
    await user.click(screen.getByRole('option', { name: 'VAST' }));
    await user.type(screen.getByRole('textbox', { name: 'Endpoint' }), 'vast.example.com:443');
    await user.type(screen.getByLabelText(/^Username/), 'admin');
    await user.type(screen.getByLabelText(/^Password/), testBackendPassword);
  };

  it('renders the page title, breadcrumb, and all fields', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Create storage backend' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Storage backends' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Provider/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Endpoint' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Description' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Username/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders the provider select with exactly vast, ceph, and pure options', async () => {
    const { user } = renderPage();

    await user.click(screen.getByLabelText(/^Provider/));

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options.map((option) => option.textContent)).toEqual(['VAST', 'Ceph', 'Pure']);
  });

  it('renders the password field as a masked input', () => {
    renderPage();

    const passwordField = screen.getByLabelText(/^Password/);
    expect(passwordField).toHaveAttribute('type', 'password');
  });

  it('shows a DNS-label validation error for an invalid name and does not submit', async () => {
    const onStorageBackendCreate = vi.fn();
    const { user } = renderPage({ onStorageBackendCreate });

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Invalid_Name');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Name must only contain lowercase letters (a-z), digits (0-9), and hyphens (-)',
        ),
      ).toBeInTheDocument();
    });
    expect(onStorageBackendCreate).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows required-field validation errors for endpoint, username, and password', async () => {
    const onStorageBackendCreate = vi.fn();
    const { user } = renderPage({ onStorageBackendCreate });

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'vast-prod-1');
    await user.click(screen.getByLabelText(/^Provider/));
    await user.click(screen.getByRole('option', { name: 'VAST' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Endpoint is required')).toBeInTheDocument();
    });
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(onStorageBackendCreate).not.toHaveBeenCalled();
  });

  it('shows a required error for provider when nothing is selected, not the removed oneOf message', async () => {
    const onStorageBackendCreate = vi.fn();
    const { user } = renderPage({ onStorageBackendCreate });

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'vast-prod-1');
    await user.type(screen.getByRole('textbox', { name: 'Endpoint' }), 'vast.example.com:443');
    await user.type(screen.getByLabelText(/^Username/), 'admin');
    await user.type(screen.getByLabelText(/^Password/), testBackendPassword);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Provider is required')).toBeInTheDocument();
    });
    expect(
      screen.queryByText('Provider must be one of vast, ceph, or pure'),
    ).not.toBeInTheDocument();
    expect(onStorageBackendCreate).not.toHaveBeenCalled();
  });

  it('disables Create while the submission is pending, to prevent duplicate submissions', async () => {
    let resolveCreate: (() => void) | undefined;
    const onStorageBackendCreate = () =>
      new Promise<StorageBackendsCreateResponse>((resolve) => {
        resolveCreate = () =>
          resolve(create(StorageBackendsCreateResponseSchema, { object: { id: 'new-backend-1' } }));
      });

    const { user } = renderPage({ onStorageBackendCreate });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    // Once isLoading is true, PatternFly's Spinner contributes its own
    // "Contents" accessible name to the button, so an exact "Create" match
    // no longer resolves — match by substring instead (same pattern already
    // used elsewhere in this file for accessible-name additions).
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create/ })).toBeDisabled();
    });
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

    resolveCreate?.();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/infrastructure/storage/backends');
    });
  }, 15000);

  it('submits the expected payload and navigates to the backends list on success', async () => {
    let capturedRequest: StorageBackendsCreateRequest | undefined;
    const { user } = renderPage({
      onStorageBackendCreate: (req) => {
        capturedRequest = req;
        return create(StorageBackendsCreateResponseSchema, {
          object: { id: 'new-backend-1', metadata: req.object?.metadata, spec: req.object?.spec },
        });
      },
    });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/infrastructure/storage/backends');
    });

    expect(capturedRequest?.object?.metadata?.name).toBe('vast-prod-1');
    expect(capturedRequest?.object?.spec?.provider).toBe('vast');
    expect(capturedRequest?.object?.spec?.endpoint).toBe('vast.example.com:443');
    expect(capturedRequest?.object?.spec?.credentials?.username).toBe('admin');
    expect(capturedRequest?.object?.spec?.credentials?.password).toBe(testBackendPassword);
  }, 15000);

  it('shows a form-level error and does not navigate when the name already exists', async () => {
    const { user } = renderPage({
      onStorageBackendCreate: () => {
        throw new ConnectError('Storage backend name already exists', Code.AlreadyExists);
      },
    });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to create storage backend')).toBeInTheDocument();
    });
    expect(screen.getByText('Storage backend name already exists')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  }, 15000);

  it('navigates back to the backends list on cancel', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockNavigate).toHaveBeenCalledWith('/admin/infrastructure/storage/backends');
  });

  it('navigates back to the backends list via breadcrumb', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Storage backends' }));

    expect(mockNavigate).toHaveBeenCalledWith('/admin/infrastructure/storage/backends');
  });
});
