import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Subnet, VirtualNetwork } from '@osac/types';
import { SubnetState, VirtualNetworkState } from '@osac/types';

import { VirtualNetworksListPage } from './VirtualNetworksListPage';
import * as networkingApi from '../../api/v1/networking';
import { mockQueryResult } from '../../test-utils/query';

vi.mock('../../api/v1/networking', async (importOriginal) => {
  const actual = await importOriginal<typeof networkingApi>();
  return {
    ...actual,
    useVirtualNetworks: vi.fn(),
    useSubnets: vi.fn(),
  };
});

describe('VirtualNetworksListPage', () => {
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
      spec: { ipv4Cidr: '10.1.0.0/16' },
      status: { state: VirtualNetworkState.PENDING },
    },
  ];

  const mockSubnets = [
    {
      id: 'subnet-1',
      metadata: { name: 'subnet-a' },
      spec: { virtualNetwork: { id: 'vn-1' }, ipv4Cidr: '10.0.1.0/24' },
      status: { state: SubnetState.READY },
    },
  ];

  beforeEach(() => {
    vi.mocked(networkingApi.useVirtualNetworks).mockReturnValue(
      mockQueryResult<VirtualNetwork[]>({ data: mockVirtualNetworks as VirtualNetwork[] }),
    );

    vi.mocked(networkingApi.useSubnets).mockReturnValue(
      mockQueryResult<Subnet[]>({ data: mockSubnets as Subnet[] }),
    );
  });

  it('renders the section label, title, and create button', () => {
    render(
      <MemoryRouter>
        <VirtualNetworksListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Networking').closest('.pf-v6-c-label')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Virtual networks' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create virtual network' })).toBeInTheDocument();
  });

  it('renders virtual network names as details links', () => {
    render(
      <MemoryRouter>
        <VirtualNetworksListPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'vn-prod' })).toHaveAttribute(
      'href',
      '/networking/virtual-networks/vn-1',
    );
  });

  it('shows empty state when no virtual networks exist', () => {
    vi.mocked(networkingApi.useVirtualNetworks).mockReturnValue(
      mockQueryResult<VirtualNetwork[]>(),
    );

    render(
      <MemoryRouter>
        <VirtualNetworksListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/No virtual networks yet/i)).toBeInTheDocument();
  });
});
