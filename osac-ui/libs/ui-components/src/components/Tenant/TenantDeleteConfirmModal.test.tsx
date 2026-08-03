import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TenantDeleteConfirmModal from './TenantDeleteConfirmModal';
import * as tenantApi from '../../api/v1/private/tenant';

vi.mock('../../api/v1/private/tenant', async (importOriginal) => {
  const actual = await importOriginal<typeof tenantApi>();
  return {
    ...actual,
    useDeleteTenant: vi.fn(),
  };
});

const mockTenant = {
  id: 'tenant-1',
  metadata: { name: 'acme-corp' },
  spec: { domains: ['acme.com'] },
};

describe('TenantDeleteConfirmModal', () => {
  const mutate = vi.fn();
  const reset = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(tenantApi.useDeleteTenant).mockReturnValue({
      mutate,
      reset,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof tenantApi.useDeleteTenant>);
  });

  it('deletes the tenant and calls onSuccess', async () => {
    const user = userEvent.setup();
    mutate.mockImplementation((_id: string, options?: { onSuccess?: () => void }) => {
      options?.onSuccess?.();
      return Promise.resolve(undefined);
    });
    const onSuccess = vi.fn();

    render(
      <TenantDeleteConfirmModal
        tenant={mockTenant as never}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Delete$/i }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith('tenant-1', {
        onSuccess: expect.any(Function) as unknown,
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows error and does not call onSuccess when mutation fails', async () => {
    const user = userEvent.setup();
    vi.mocked(tenantApi.useDeleteTenant).mockReturnValue({
      mutate,
      reset,
      isPending: false,
      error: new Error('permission denied'),
    } as unknown as ReturnType<typeof tenantApi.useDeleteTenant>);
    const onSuccess = vi.fn();

    render(
      <TenantDeleteConfirmModal
        tenant={mockTenant as never}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^Delete$/i }));

    await waitFor(() => {
      expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <TenantDeleteConfirmModal
        tenant={mockTenant as never}
        onClose={onClose}
        onSuccess={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
