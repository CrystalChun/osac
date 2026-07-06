import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SubnetCreateModal } from './SubnetCreateModal';

describe('SubnetCreateModal', () => {
  const mockOnClose = vi.fn();
  const mockOnCreate = vi.fn();
  const mockParentVN = {
    id: 'vn-123',
    metadata: { name: 'prod-vn' },
    spec: { ipv4Cidr: '10.0.0.0/16' },
    status: { state: 'VIRTUAL_NETWORK_STATE_READY' as const },
  };
  const mockExistingSubnets = [
    {
      id: 'subnet-1',
      metadata: { name: 'subnet-web' },
      spec: { virtualNetwork: 'vn-123', ipv4Cidr: '10.0.1.0/24' },
      status: { state: 'SUBNET_STATE_READY' as const },
    },
  ];

  it('renders with Name and CIDR fields', () => {
    render(
      <SubnetCreateModal
        isOpen
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
        isOpen
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
        isOpen
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
