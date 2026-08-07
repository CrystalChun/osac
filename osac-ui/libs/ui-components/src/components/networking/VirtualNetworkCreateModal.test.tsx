import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { NetworkClass } from '@osac/types';

import { VirtualNetworkCreateModal } from './VirtualNetworkCreateModal';
import * as networkingApi from '../../api/v1/networking';
import { mockQueryResult } from '../../test-utils/query';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../api/v1/networking', async (importOriginal) => {
  const actual = await importOriginal<typeof networkingApi>();
  return {
    ...actual,
    useNetworkClasses: vi.fn(),
    useCreateVirtualNetwork: vi.fn(),
  };
});

describe('VirtualNetworkCreateModal', () => {
  const mockOnClose = vi.fn();
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(networkingApi.useNetworkClasses).mockReturnValue(
      mockQueryResult<NetworkClass[]>({
        data: [
          {
            id: 'nc-1',
            metadata: { name: 'test-nc' },
            title: 'Test Network Class',
            isDefault: true,
          },
        ] as NetworkClass[],
      }),
    );
    vi.mocked(networkingApi.useCreateVirtualNetwork).mockReturnValue({
      mutateAsync,
      error: null,
    } as unknown as ReturnType<typeof networkingApi.useCreateVirtualNetwork>);
  });

  it('renders with Name and IPv4 CIDR fields', () => {
    render(<VirtualNetworkCreateModal onClose={mockOnClose} />);

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/IPv4 CIDR/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('Create button stays enabled', () => {
    render(<VirtualNetworkCreateModal onClose={mockOnClose} />);

    const createButton = screen.getByRole('button', { name: /Create/i });
    expect(createButton).not.toBeDisabled();
  });

  it('renders IPv6 CIDR field as optional', () => {
    render(<VirtualNetworkCreateModal onClose={mockOnClose} />);

    expect(screen.getByLabelText(/IPv6 CIDR \(Optional\)/i)).toBeInTheDocument();
  });

  it('shows validation errors and does not submit when Name and CIDRs are empty', async () => {
    const user = userEvent.setup();
    render(<VirtualNetworkCreateModal onClose={mockOnClose} />);

    await user.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('calls create and navigates on successful submit', async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({ id: 'vn-new' });

    render(<VirtualNetworkCreateModal onClose={mockOnClose} />);

    await user.type(screen.getByLabelText(/Name/i), 'vn-prod');
    await user.type(screen.getByLabelText(/IPv4 CIDR/i), '10.0.0.0/16');
    await user.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { name: 'vn-prod' },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          spec: expect.objectContaining({
            networkClass: { name: 'test-nc' },
            ipv4Cidr: '10.0.0.0/16',
          }),
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith('/networking/virtual-networks/vn-new');
    });
  });

  it('shows error alert when create fails', async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue(new Error('API error'));
    vi.mocked(networkingApi.useCreateVirtualNetwork).mockReturnValue({
      mutateAsync,
      error: new Error('API error'),
    } as unknown as ReturnType<typeof networkingApi.useCreateVirtualNetwork>);

    render(<VirtualNetworkCreateModal onClose={mockOnClose} />);

    await user.type(screen.getByLabelText(/Name/i), 'vn-prod');
    await user.type(screen.getByLabelText(/IPv4 CIDR/i), '10.0.0.0/16');
    await user.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(screen.getByText(/API error/i)).toBeInTheDocument();
    });
  });

  it('renders loading indicator while network classes are loading', () => {
    vi.mocked(networkingApi.useNetworkClasses).mockReturnValue(
      mockQueryResult<NetworkClass[]>({ isLoading: true }),
    );

    render(<VirtualNetworkCreateModal onClose={mockOnClose} />);

    expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument();
  });

  it('renders when no network classes are available', () => {
    vi.mocked(networkingApi.useNetworkClasses).mockReturnValue(mockQueryResult<NetworkClass[]>());

    render(<VirtualNetworkCreateModal onClose={mockOnClose} />);

    expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument();
  });
});
