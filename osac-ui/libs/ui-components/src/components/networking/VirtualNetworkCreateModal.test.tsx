import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { NetworkClass } from '@osac/types';

import { VirtualNetworkCreateModal } from './VirtualNetworkCreateModal';
import * as networkingApi from '../../api/v1/networking';
import { mockQueryResult } from '../../test-utils/query';

vi.mock('../../api/v1/networking', async (importOriginal) => {
  const actual = await importOriginal<typeof networkingApi>();
  return {
    ...actual,
    useNetworkClasses: vi.fn(),
  };
});

describe('VirtualNetworkCreateModal', () => {
  const mockOnClose = vi.fn();
  const mockOnCreate = vi.fn();
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(networkingApi.useNetworkClasses).mockReturnValue(
      mockQueryResult<NetworkClass[]>({
        data: [{ id: 'test-network-class', title: 'Test Network Class' }] as NetworkClass[],
      }),
    );
  });

  it('renders with Name and IPv4 CIDR fields', () => {
    render(
      <VirtualNetworkCreateModal
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        onNavigate={mockOnNavigate}
      />,
    );

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/IPv4 CIDR/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('Create button stays enabled', () => {
    render(
      <VirtualNetworkCreateModal
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        onNavigate={mockOnNavigate}
      />,
    );

    const createButton = screen.getByRole('button', { name: /Create/i });
    expect(createButton).not.toBeDisabled();
  });

  it('renders IPv6 CIDR field as optional', () => {
    render(
      <VirtualNetworkCreateModal
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        onNavigate={mockOnNavigate}
      />,
    );

    expect(screen.getByLabelText(/IPv6 CIDR \(Optional\)/i)).toBeInTheDocument();
  });

  it('shows validation errors and does not submit when Name and CIDRs are empty', async () => {
    const user = userEvent.setup();
    render(
      <VirtualNetworkCreateModal
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        onNavigate={mockOnNavigate}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  it('calls onCreate and onNavigate on successful submit', async () => {
    const user = userEvent.setup();
    mockOnCreate.mockResolvedValue({ id: 'vn-new' });

    render(
      <VirtualNetworkCreateModal
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        onNavigate={mockOnNavigate}
      />,
    );

    await user.type(screen.getByLabelText(/Name/i), 'vn-prod');
    await user.type(screen.getByLabelText(/IPv4 CIDR/i), '10.0.0.0/16');
    await user.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalledWith({
        name: 'vn-prod',
        network_class: 'test-network-class',
        ipv4_cidr: '10.0.0.0/16',
      });
      expect(mockOnNavigate).toHaveBeenCalledWith('vn-new');
    });
  });

  it('shows error alert when onCreate fails', async () => {
    const user = userEvent.setup();
    mockOnCreate.mockRejectedValue(new Error('API error'));

    render(
      <VirtualNetworkCreateModal
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        onNavigate={mockOnNavigate}
      />,
    );

    await user.type(screen.getByLabelText(/Name/i), 'vn-prod');
    await user.type(screen.getByLabelText(/IPv4 CIDR/i), '10.0.0.0/16');
    await user.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(screen.getByText(/API error/i)).toBeInTheDocument();
    });
  });

  it('disables Create button while network classes are loading', () => {
    vi.mocked(networkingApi.useNetworkClasses).mockReturnValue(
      mockQueryResult<NetworkClass[]>({ isLoading: true }),
    );

    render(
      <VirtualNetworkCreateModal
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        onNavigate={mockOnNavigate}
      />,
    );

    expect(screen.getByRole('button', { name: /Create/i })).toBeDisabled();
  });

  it('disables Create button when no network classes are available', () => {
    vi.mocked(networkingApi.useNetworkClasses).mockReturnValue(mockQueryResult<NetworkClass[]>());

    render(
      <VirtualNetworkCreateModal
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        onNavigate={mockOnNavigate}
      />,
    );

    expect(screen.getByRole('button', { name: /Create/i })).toBeDisabled();
  });
});
