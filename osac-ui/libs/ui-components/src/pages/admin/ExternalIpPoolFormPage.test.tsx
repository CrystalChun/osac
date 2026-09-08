import { create } from '@bufbuild/protobuf';
import { Code, ConnectError } from '@connectrpc/connect';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type ExternalIPPoolsCreateRequest,
  ExternalIPPoolsCreateResponseSchema,
  IPFamily,
} from '@osac/types/private';

import { ExternalIpPoolFormPage } from './ExternalIpPoolFormPage';
import type { MockTransportOverrides } from '../../test-utils/createMockConnectTransport';
import { renderWithProviders } from '../../test-utils/TestProviders';

const LIST_PATH = '/admin/infrastructure/external-ip-pools';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    // useBlocker requires a data router; this harness renders under a plain
    // MemoryRouter, so LeaveFormConfirmation's blocking behavior is stubbed out.
    useBlocker: () => ({ state: 'unblocked' as const }),
  };
});

const renderCreatePage = (overrides?: MockTransportOverrides) =>
  renderWithProviders(<ExternalIpPoolFormPage />, {
    transportOverrides: overrides,
  });

describe('ExternalIpPoolFormPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  describe('create mode', () => {
    const fillValidForm = async (user: ReturnType<typeof renderCreatePage>['user']) => {
      await user.type(screen.getByRole('textbox', { name: 'Name' }), 'prod-v4');
      await user.click(screen.getByLabelText(/^IP family/));
      await user.click(screen.getByRole('option', { name: 'IPv4' }));
      await user.type(screen.getByRole('textbox', { name: 'CIDR 1' }), '192.168.1.0/24');
    };

    it('renders the page title, breadcrumb, and all fields', () => {
      renderCreatePage();

      expect(screen.getByRole('heading', { name: 'Create external IP pool' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'External IP pools' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
      expect(screen.getByLabelText(/^IP family/)).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'CIDR 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('renders name, IP family, and CIDR as enabled', () => {
      renderCreatePage();

      expect(screen.getByRole('textbox', { name: 'Name' })).toBeEnabled();
      expect(screen.getByLabelText(/^IP family/)).toBeEnabled();
      expect(screen.getByRole('textbox', { name: 'CIDR 1' })).toBeEnabled();
    });

    it('renders the IP family select with exactly IPv4 and IPv6 options', async () => {
      const { user } = renderCreatePage();

      await user.click(screen.getByLabelText(/^IP family/));

      const options = screen.getAllByRole('option');
      expect(options.map((option) => option.textContent)).toEqual(['IPv4', 'IPv6']);
    });

    it('adds and removes CIDR rows, keeping at least one', async () => {
      const { user } = renderCreatePage();

      expect(screen.queryByRole('textbox', { name: 'CIDR 2' })).not.toBeInTheDocument();
      // A single remaining CIDR row cannot be removed.
      expect(screen.queryByRole('button', { name: 'Remove CIDR 1' })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Add CIDR' }));

      expect(screen.getByRole('textbox', { name: 'CIDR 2' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Remove CIDR 2' }));

      expect(screen.queryByRole('textbox', { name: 'CIDR 2' })).not.toBeInTheDocument();
    });

    it('shows a DNS-label validation error for an invalid name and does not submit', async () => {
      const onExternalIPPoolCreate = vi.fn();
      const { user } = renderCreatePage({ onExternalIPPoolCreate });

      await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Invalid_Name');
      await user.click(screen.getByLabelText(/^IP family/));
      await user.click(screen.getByRole('option', { name: 'IPv4' }));
      await user.type(screen.getByRole('textbox', { name: 'CIDR 1' }), '192.168.1.0/24');
      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(
          screen.getByText(
            'Name must only contain lowercase letters (a-z), digits (0-9), and hyphens (-)',
          ),
        ).toBeInTheDocument();
      });
      expect(onExternalIPPoolCreate).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('shows a validation error for a malformed CIDR and does not submit', async () => {
      const onExternalIPPoolCreate = vi.fn();
      const { user } = renderCreatePage({ onExternalIPPoolCreate });

      await user.type(screen.getByRole('textbox', { name: 'Name' }), 'prod-v4');
      await user.click(screen.getByLabelText(/^IP family/));
      await user.click(screen.getByRole('option', { name: 'IPv4' }));
      await user.type(screen.getByRole('textbox', { name: 'CIDR 1' }), 'not-a-cidr');
      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(screen.getByText('Invalid IPv4 CIDR notation')).toBeInTheDocument();
      });
      expect(onExternalIPPoolCreate).not.toHaveBeenCalled();
    });

    it('rejects a CIDR that does not match the selected IP family', async () => {
      const onExternalIPPoolCreate = vi.fn();
      const { user } = renderCreatePage({ onExternalIPPoolCreate });

      await user.type(screen.getByRole('textbox', { name: 'Name' }), 'prod-v4');
      await user.click(screen.getByLabelText(/^IP family/));
      await user.click(screen.getByRole('option', { name: 'IPv4' }));
      await user.type(screen.getByRole('textbox', { name: 'CIDR 1' }), '2001:db8::/32');
      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(screen.getByText('Invalid IPv4 CIDR notation')).toBeInTheDocument();
      });
      expect(onExternalIPPoolCreate).not.toHaveBeenCalled();
    });

    it('requires an IP family selection', async () => {
      const onExternalIPPoolCreate = vi.fn();
      const { user } = renderCreatePage({ onExternalIPPoolCreate });

      await user.type(screen.getByRole('textbox', { name: 'Name' }), 'prod-v4');
      await user.type(screen.getByRole('textbox', { name: 'CIDR 1' }), '192.168.1.0/24');
      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(screen.getByText('IP family is required')).toBeInTheDocument();
      });
      expect(onExternalIPPoolCreate).not.toHaveBeenCalled();
    });

    it('submits the expected payload and navigates to the list on success', async () => {
      let capturedRequest: ExternalIPPoolsCreateRequest | undefined;
      const { user } = renderCreatePage({
        onExternalIPPoolCreate: (req) => {
          capturedRequest = req;
          return create(ExternalIPPoolsCreateResponseSchema, {
            object: { id: 'new-external-ip-pool-1' },
          });
        },
      });

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(LIST_PATH);
      });

      expect(capturedRequest?.object?.metadata?.name).toBe('prod-v4');
      expect(capturedRequest?.object?.spec?.ipFamily).toBe(IPFamily.IP_FAMILY_IPV4);
      expect(capturedRequest?.object?.spec?.cidrs).toEqual(['192.168.1.0/24']);
    }, 15000);

    it('shows a form-level error and does not navigate when the name already exists', async () => {
      const { user } = renderCreatePage({
        onExternalIPPoolCreate: () => {
          throw new ConnectError('External IP pool name already exists', Code.AlreadyExists);
        },
      });

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create external IP pool')).toBeInTheDocument();
      });
      expect(screen.getByText('External IP pool name already exists')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    }, 15000);

    it('navigates back to the list on cancel', async () => {
      const { user } = renderCreatePage();

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockNavigate).toHaveBeenCalledWith(LIST_PATH);
    });
  });
});
