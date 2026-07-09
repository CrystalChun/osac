import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Protocol, SecurityGroupState, SubnetState, VirtualNetworkState } from '@osac/types';

import { VirtualNetworkDetailPage } from './VirtualNetworkDetailPage';
import * as networkingApi from '../../api/v1/networking';

vi.mock('../../api/v1/networking', async (importOriginal) => {
  const actual = await importOriginal<typeof networkingApi>();
  return {
    ...actual,
    useVirtualNetwork: vi.fn(),
    useVirtualNetworks: vi.fn(),
    useSubnets: vi.fn(),
    useSecurityGroups: vi.fn(),
    useCreateSubnet: vi.fn(),
    useCreateSecurityGroup: vi.fn(),
  };
});

describe('VirtualNetworkDetailPage', () => {
  const mockVN = {
    id: 'vn-1',
    metadata: { name: 'vn-prod' },
    spec: { ipv4Cidr: '10.0.0.0/16' },
    status: { state: VirtualNetworkState.READY },
  };

  const mockSecurityGroups = [
    {
      id: 'sg-1',
      metadata: { name: 'sg-web' },
      spec: {
        virtualNetwork: 'vn-1',
        ingress: [{ protocol: Protocol.TCP, portFrom: 80, portTo: 80 }],
        egress: [],
      },
      status: { state: SecurityGroupState.READY },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(networkingApi.useVirtualNetwork).mockReturnValue({
      data: mockVN,
      isLoading: false,
      error: null,
    } as ReturnType<typeof networkingApi.useVirtualNetwork>);

    vi.mocked(networkingApi.useVirtualNetworks).mockReturnValue({
      data: [mockVN],
      isLoading: false,
      error: null,
    } as ReturnType<typeof networkingApi.useVirtualNetworks>);

    vi.mocked(networkingApi.useSubnets).mockReturnValue({
      data: [
        {
          id: 'subnet-1',
          metadata: { name: 'subnet-a' },
          spec: { ipv4Cidr: '10.0.1.0/24' },
          status: { state: SubnetState.READY },
        },
      ],
      isLoading: false,
      error: null,
    } as ReturnType<typeof networkingApi.useSubnets>);

    vi.mocked(networkingApi.useSecurityGroups).mockReturnValue({
      data: mockSecurityGroups,
      isLoading: false,
      error: null,
    } as ReturnType<typeof networkingApi.useSecurityGroups>);

    vi.mocked(networkingApi.useCreateSubnet).mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof networkingApi.useCreateSubnet>);

    vi.mocked(networkingApi.useCreateSecurityGroup).mockReturnValue({
      mutateAsync: vi.fn(),
      error: null,
    } as unknown as ReturnType<typeof networkingApi.useCreateSecurityGroup>);
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/networking/virtual-networks/vn-1']}>
        <Routes>
          <Route path="/networking/virtual-networks/:id" element={<VirtualNetworkDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

  it('renders the security groups scoped to this virtual network', () => {
    renderPage();

    expect(screen.getByText('Security groups')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'sg-web' })).toBeInTheDocument();
  });

  it('shows an empty state when there are no security groups', () => {
    vi.mocked(networkingApi.useSecurityGroups).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof networkingApi.useSecurityGroups>);

    renderPage();

    expect(screen.getByText(/No security groups yet/i)).toBeInTheDocument();
  });

  it('opens the create modal with the current virtual network pre-selected and locked', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Create security group/i }));

    expect(screen.getByRole('heading', { name: 'Create security group' })).toBeInTheDocument();
    const vnField = screen.getByLabelText(/Virtual Network/i);
    expect(vnField).toHaveTextContent(/vn-prod/i);
    expect(vnField.closest('button')).toBeDisabled();
  });
});
