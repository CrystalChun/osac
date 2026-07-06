import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { Protocol, SecurityGroupState, VirtualNetworkState } from '@osac/types';

import { SecurityGroupsListPage } from './SecurityGroupsListPage';
import * as networkingApi from '../../api/v1/networking';

vi.mock('../../api/v1/networking', async (importOriginal) => {
  const actual = await importOriginal<typeof networkingApi>();
  return {
    ...actual,
    useSecurityGroups: vi.fn(),
    useVirtualNetworks: vi.fn(),
    useCreateSecurityGroup: vi.fn(),
  };
});

describe('SecurityGroupsListPage', () => {
  const mockVirtualNetworks = [
    {
      id: 'vn-1',
      metadata: { name: 'vn-prod' },
      spec: { ipv4Cidr: '10.0.0.0/16' },
      status: { state: VirtualNetworkState.READY },
    },
  ];

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
    {
      id: 'sg-2',
      metadata: { name: 'sg-db' },
      spec: {
        virtualNetwork: 'vn-1',
        ingress: [{ protocol: Protocol.TCP, portFrom: 3306, portTo: 3306 }],
        egress: [{ protocol: Protocol.ALL }],
      },
      status: { state: SecurityGroupState.PENDING },
    },
  ];

  beforeEach(() => {
    vi.mocked(networkingApi.useVirtualNetworks).mockReturnValue({
      data: mockVirtualNetworks,
      isLoading: false,
      error: null,
    } as ReturnType<typeof networkingApi.useVirtualNetworks>);

    vi.mocked(networkingApi.useSecurityGroups).mockReturnValue({
      data: mockSecurityGroups,
      isLoading: false,
      error: null,
    } as ReturnType<typeof networkingApi.useSecurityGroups>);

    vi.mocked(networkingApi.useCreateSecurityGroup).mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof networkingApi.useCreateSecurityGroup>);
  });

  it('renders page title and create button', () => {
    render(
      <MemoryRouter>
        <SecurityGroupsListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Security groups')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create security group/i })).toBeInTheDocument();
  });

  it('renders table with Name, VN, Inbound/Outbound Rules, Status columns', () => {
    render(
      <MemoryRouter>
        <SecurityGroupsListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Virtual Network')).toBeInTheDocument();
    expect(screen.getByText('Inbound Rules')).toBeInTheDocument();
    expect(screen.getByText('Outbound Rules')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('displays security groups with rule counts', () => {
    render(
      <MemoryRouter>
        <SecurityGroupsListPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'sg-web' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'sg-db' })).toBeInTheDocument();

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3); // header + 2 data rows
  });

  it('shows empty state when no security groups exist', () => {
    vi.mocked(networkingApi.useSecurityGroups).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof networkingApi.useSecurityGroups>);

    render(
      <MemoryRouter>
        <SecurityGroupsListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/No security groups yet/i)).toBeInTheDocument();
  });

  it('filters security groups by search term', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SecurityGroupsListPage />
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText(/Search security groups/i);
    await user.type(searchInput, 'web');

    expect(screen.getByRole('button', { name: 'sg-web' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'sg-db' })).not.toBeInTheDocument();
  });

  it('opens create modal when Create button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SecurityGroupsListPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Create security group/i }));
    expect(screen.getByText('Create security group')).toBeInTheDocument();
  });
});
