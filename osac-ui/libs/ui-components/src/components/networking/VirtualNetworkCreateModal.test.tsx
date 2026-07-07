import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VirtualNetworkCreateModal } from './VirtualNetworkCreateModal';

vi.mock('../../api/v1/networking', async () => {
  const actual = await vi.importActual('../../api/v1/networking');
  return {
    ...actual,
    useNetworkClasses: () => ({
      data: [{ id: 'test-network-class', metadata: { name: 'Test Network Class' } }],
      isLoading: false,
    }),
  };
});

describe('VirtualNetworkCreateModal', () => {
  const mockOnClose = vi.fn();
  const mockOnCreate = vi.fn();
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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
});
