import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SecurityGroup, VirtualNetwork } from '@osac/types';
import { Protocol, SecurityGroupState, SubnetState, VirtualNetworkState } from '@osac/types';

import { VirtualNetworkDetailPage } from './VirtualNetworkDetailPage';
import * as networkingApi from '../../api/v1/networking';
import { mockMutationResult, mockQueryResult } from '../../test-utils/query';

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
  const mockVN: VirtualNetwork = {
    $typeName: 'osac.public.v1.VirtualNetwork',
    id: 'vn-1',
    metadata: {
      $typeName: 'osac.public.v1.Metadata',
      name: 'vn-prod',
      annotations: {},
      creator: 'foo',
      labels: {},
      project: 'foo',
      tenant: 'foo',
      version: 1,
    },
    spec: {
      $typeName: 'osac.public.v1.VirtualNetworkSpec',
      ipv4Cidr: '10.0.0.0/16',
      networkClass: '',
    },
    status: {
      $typeName: 'osac.public.v1.VirtualNetworkStatus',
      state: VirtualNetworkState.READY,
    },
  };

  const mockSecurityGroups: SecurityGroup[] = [
    {
      $typeName: 'osac.public.v1.SecurityGroup',
      id: 'sg-1',
      metadata: {
        $typeName: 'osac.public.v1.Metadata',
        name: 'sg-web',
        annotations: {},
        creator: 'foo',
        labels: {},
        project: 'foo',
        tenant: 'foo',
        version: 1,
      },

      spec: {
        $typeName: 'osac.public.v1.SecurityGroupSpec',
        virtualNetwork: 'vn-1',
        ingress: [
          {
            $typeName: 'osac.public.v1.SecurityRule',
            protocol: Protocol.TCP,
            portFrom: 80,
            portTo: 80,
          },
        ],
        egress: [],
      },
      status: {
        $typeName: 'osac.public.v1.SecurityGroupStatus',
        state: SecurityGroupState.READY,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(networkingApi.useVirtualNetwork).mockReturnValue(mockQueryResult({ data: mockVN }));

    vi.mocked(networkingApi.useVirtualNetworks).mockReturnValue(
      mockQueryResult({ data: [mockVN] }),
    );

    vi.mocked(networkingApi.useSubnets).mockReturnValue(
      mockQueryResult({
        data: [
          {
            $typeName: 'osac.public.v1.Subnet',
            id: 'subnet-1',
            metadata: {
              $typeName: 'osac.public.v1.Metadata',
              name: 'subnet-a',
              annotations: {},
              creator: 'foo',
              labels: {},
              project: 'foo',
              tenant: 'foo',
              version: 1,
            },
            spec: {
              $typeName: 'osac.public.v1.SubnetSpec',
              ipv4Cidr: '10.0.1.0/24',
              virtualNetwork: '',
            },
            status: {
              $typeName: 'osac.public.v1.SubnetStatus',
              state: SubnetState.READY,
            },
          },
        ],
      }),
    );

    vi.mocked(networkingApi.useSecurityGroups).mockReturnValue(
      mockQueryResult({ data: mockSecurityGroups }),
    );

    vi.mocked(networkingApi.useCreateSubnet).mockReturnValue(
      mockMutationResult({ mutateAsync: vi.fn() }),
    );

    vi.mocked(networkingApi.useCreateSecurityGroup).mockReturnValue(
      mockMutationResult({ mutateAsync: vi.fn(), error: null }),
    );
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
    vi.mocked(networkingApi.useSecurityGroups).mockReturnValue(mockQueryResult({ data: [] }));

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
