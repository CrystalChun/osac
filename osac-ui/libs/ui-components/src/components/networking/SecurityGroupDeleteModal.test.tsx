import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SecurityGroupDeleteModal } from './SecurityGroupDeleteModal';
import * as networkingApi from '../../api/v1/networking';

vi.mock('../../api/v1/networking', async (importOriginal) => {
  const actual = await importOriginal<typeof networkingApi>();
  return {
    ...actual,
    useDeleteSecurityGroup: vi.fn(),
  };
});

describe('SecurityGroupDeleteModal', () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(networkingApi.useDeleteSecurityGroup).mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof networkingApi.useDeleteSecurityGroup>);
  });

  it('deletes the security group and calls onDeleted on success', async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue(undefined);
    const onDeleted = vi.fn();

    render(
      <SecurityGroupDeleteModal onClose={vi.fn()} onDeleted={onDeleted} securityGroupId="sg-1" />,
    );

    await user.click(screen.getByRole('button', { name: /Delete/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith('sg-1');
      expect(onDeleted).toHaveBeenCalled();
    });
  });

  it('shows error and does not call onDeleted when the mutation fails', async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue(new Error('boom'));
    vi.mocked(networkingApi.useDeleteSecurityGroup).mockReturnValue({
      mutateAsync,
      isPending: false,
      error: new Error('boom'),
    } as unknown as ReturnType<typeof networkingApi.useDeleteSecurityGroup>);
    const onDeleted = vi.fn();

    render(
      <SecurityGroupDeleteModal onClose={vi.fn()} onDeleted={onDeleted} securityGroupId="sg-1" />,
    );

    await user.click(screen.getByRole('button', { name: /Delete/i }));

    await waitFor(() => {
      expect(screen.getByText(/boom/i)).toBeInTheDocument();
    });
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <SecurityGroupDeleteModal onClose={onClose} onDeleted={vi.fn()} securityGroupId="sg-1" />,
    );

    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
