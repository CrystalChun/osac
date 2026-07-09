import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Protocol, type SecurityGroup } from '@osac/types';

import { SecurityGroupDeleteRuleModal } from './SecurityGroupDeleteRuleModal';
import * as networkingApi from '../../api/v1/networking';

vi.mock('../../api/v1/networking', async (importOriginal) => {
  const actual = await importOriginal<typeof networkingApi>();
  return {
    ...actual,
    useUpdateSecurityGroup: vi.fn(),
  };
});

describe('SecurityGroupDeleteRuleModal', () => {
  const mutateAsync = vi.fn();

  const securityGroup: SecurityGroup = {
    id: 'sg-1',
    metadata: { name: 'sg-web' },
    spec: {
      virtualNetwork: 'vn-1',
      ingress: [
        { protocol: Protocol.TCP, portFrom: 80, portTo: 80, ipv4Cidr: '0.0.0.0/0' },
        { protocol: Protocol.TCP, portFrom: 443, portTo: 443, ipv4Cidr: '0.0.0.0/0' },
      ],
      egress: [{ protocol: Protocol.ALL }],
    },
  } as unknown as SecurityGroup;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(networkingApi.useUpdateSecurityGroup).mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof networkingApi.useUpdateSecurityGroup>);
  });

  it('removes the targeted rule from the direction array and closes on success', async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({ id: 'sg-1' });
    const onClose = vi.fn();

    render(
      <SecurityGroupDeleteRuleModal
        onClose={onClose}
        securityGroup={securityGroup}
        direction="ingress"
        ruleIndex={0}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Delete/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        id: 'sg-1',
        input: expect.objectContaining({
          spec: expect.objectContaining({
            ingress: [expect.objectContaining({ portFrom: 443, portTo: 443 })],
          }),
        }),
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows error and keeps modal open when the mutation fails', async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue(new Error('boom'));
    vi.mocked(networkingApi.useUpdateSecurityGroup).mockReturnValue({
      mutateAsync,
      isPending: false,
      error: new Error('boom'),
    } as unknown as ReturnType<typeof networkingApi.useUpdateSecurityGroup>);
    const onClose = vi.fn();

    render(
      <SecurityGroupDeleteRuleModal
        onClose={onClose}
        securityGroup={securityGroup}
        direction="egress"
        ruleIndex={0}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Delete/i }));

    await waitFor(() => {
      expect(screen.getByText(/boom/i)).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <SecurityGroupDeleteRuleModal
        onClose={onClose}
        securityGroup={securityGroup}
        direction="ingress"
        ruleIndex={0}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
