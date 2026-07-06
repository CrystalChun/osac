import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { VirtualNetworkState } from '@osac/types';

import * as networkingApi from '../../api/v1/networking';
import { SecurityGroupCreateModal } from './SecurityGroupCreateModal';

vi.mock('../../api/v1/networking', async (importOriginal) => {
  const actual = await importOriginal<typeof networkingApi>();
  return {
    ...actual,
    useVirtualNetworks: vi.fn(),
  };
});

describe('SecurityGroupCreateModal', () => {
  const mockVirtualNetworks = [
    {
      id: 'vn-1',
      metadata: { name: 'vn-prod' },
      spec: { ipv4Cidr: '10.0.0.0/16' },
      status: { state: VirtualNetworkState.READY },
    },
    {
      id: 'vn-2',
      metadata: { name: 'vn-dev' },
      spec: { ipv4Cidr: '192.168.0.0/16' },
      status: { state: VirtualNetworkState.READY },
    },
  ];

  beforeEach(() => {
    vi.mocked(networkingApi.useVirtualNetworks).mockReturnValue({
      data: mockVirtualNetworks,
      isLoading: false,
      error: null,
    } as ReturnType<typeof networkingApi.useVirtualNetworks>);
  });

  it('renders modal with VN dropdown and Name field', () => {
    render(
      <SecurityGroupCreateModal
        isOpen={true}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByText('Create security group')).toBeInTheDocument();
    expect(screen.getByLabelText(/Virtual Network/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('pre-selects virtual network when virtualNetworkId prop is provided', () => {
    render(
      <SecurityGroupCreateModal
        isOpen={true}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onNavigate={vi.fn()}
        virtualNetworkId="vn-1"
      />,
    );

    const vnSelect = screen.getByLabelText(/Virtual Network/i) as HTMLSelectElement;
    expect(vnSelect.value).toBe('vn-1');
  });

  it('calls onCreate and onNavigate on successful submit', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue({ id: 'sg-new' });
    const onNavigate = vi.fn();

    render(
      <SecurityGroupCreateModal
        isOpen={true}
        onClose={vi.fn()}
        onCreate={onCreate}
        onNavigate={onNavigate}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/Virtual Network/i), 'vn-1');
    await user.type(screen.getByLabelText(/Name/i), 'sg-web');
    await user.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        name: 'sg-web',
        virtual_network: 'vn-1',
        ingress: [],
        egress: [],
      });
      expect(onNavigate).toHaveBeenCalledWith('sg-new');
    });
  });

  it('shows error alert when onCreate fails', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockRejectedValue(new Error('API error'));

    render(
      <SecurityGroupCreateModal
        isOpen={true}
        onClose={vi.fn()}
        onCreate={onCreate}
        onNavigate={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/Virtual Network/i), 'vn-1');
    await user.type(screen.getByLabelText(/Name/i), 'sg-web');
    await user.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(screen.getByText(/API error/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <SecurityGroupCreateModal
        isOpen={true}
        onClose={onClose}
        onCreate={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
