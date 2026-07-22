import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Subnet, SubnetState, VirtualNetwork, VirtualNetworkState } from '@osac/types';

import { SubnetCreateModal } from './SubnetCreateModal';

describe('SubnetCreateModal', () => {
  const mockOnClose = vi.fn();
  const mockOnCreate = vi.fn();
  const mockParentVN: VirtualNetwork = {
    $typeName: 'osac.public.v1.VirtualNetwork',
    id: 'vn-123',
    metadata: {
      $typeName: 'osac.public.v1.Metadata',
      name: 'prod-vn',
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
  const mockExistingSubnets: Subnet[] = [
    {
      $typeName: 'osac.public.v1.Subnet',
      id: 'subnet-1',
      metadata: {
        $typeName: 'osac.public.v1.Metadata',
        name: 'subnet-web',
        annotations: {},
        creator: 'foo',
        labels: {},
        project: 'foo',
        tenant: 'foo',
        version: 1,
      },
      spec: {
        $typeName: 'osac.public.v1.SubnetSpec',
        virtualNetwork: 'vn-123',
        ipv4Cidr: '10.0.1.0/24',
      },
      status: {
        $typeName: 'osac.public.v1.SubnetStatus',
        state: SubnetState.READY,
      },
    },
  ];

  it('renders with Name and CIDR fields', () => {
    render(
      <SubnetCreateModal
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        parentVN={mockParentVN}
        existingSubnets={mockExistingSubnets}
      />,
    );

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CIDR/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('displays parent VN CIDR as context', () => {
    render(
      <SubnetCreateModal
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        parentVN={mockParentVN}
        existingSubnets={mockExistingSubnets}
      />,
    );

    expect(screen.getByText(/10\.0\.0\.0\/16/)).toBeInTheDocument();
  });

  it('Create button stays enabled', () => {
    render(
      <SubnetCreateModal
        onClose={mockOnClose}
        onCreate={mockOnCreate}
        parentVN={mockParentVN}
        existingSubnets={mockExistingSubnets}
      />,
    );

    const createButton = screen.getByRole('button', { name: /Create/i });
    expect(createButton).not.toBeDisabled();
  });
});
