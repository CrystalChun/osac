import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IPFamily } from '@osac/types';

import AttachPublicIpModal from './AttachPublicIpModal';

const mutateAsync = vi.fn();
const reset = vi.fn();
let error: Error | null = null;

vi.mock('../../../api/v1/public-ip', async () => {
  const actual = await vi.importActual('../../../api/v1/public-ip');
  return {
    ...actual,
    useAttachPublicIp: () => ({
      mutateAsync,
      reset,
      get error() {
        return error;
      },
    }),
  };
});

const vm = { id: 'vm-1', metadata: { name: 'test-vm' } } as never;

describe('AttachPublicIpModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    error = null;
    mutateAsync.mockResolvedValue({ id: 'attachment-1' });
  });

  it('renders IPv4 and IPv6 options, defaulting to IPv4', () => {
    render(<AttachPublicIpModal vm={vm} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const ipv4 = screen.getByRole('radio', { name: 'IPv4' });
    const ipv6 = screen.getByRole('radio', { name: 'IPv6' });
    expect(ipv4).toBeChecked();
    expect(ipv6).not.toBeChecked();
  });

  it('submits with IPv4 by default', async () => {
    const user = userEvent.setup();
    render(<AttachPublicIpModal vm={vm} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await user.click(screen.getByRole('button', { name: /Attach/i }));

    expect(mutateAsync).toHaveBeenCalledWith({
      computeInstanceId: 'vm-1',
      ipFamily: IPFamily.IP_FAMILY_IPV4,
    });
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('submits with IPv6 when selected', async () => {
    const user = userEvent.setup();
    render(<AttachPublicIpModal vm={vm} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await user.click(screen.getByRole('radio', { name: 'IPv6' }));
    await user.click(screen.getByRole('button', { name: /Attach/i }));

    expect(mutateAsync).toHaveBeenCalledWith({
      computeInstanceId: 'vm-1',
      ipFamily: IPFamily.IP_FAMILY_IPV6,
    });
  });

  it('renders an inline error and does not close on failure', async () => {
    error = new Error('no IPv4 addresses available');
    mutateAsync.mockRejectedValue(error);
    const user = userEvent.setup();
    render(<AttachPublicIpModal vm={vm} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await user.click(screen.getByRole('button', { name: /Attach/i }));

    expect(screen.getByText('no IPv4 addresses available')).toBeInTheDocument();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
