import { I18nextProvider } from 'react-i18next';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ComputeInstance } from '@osac/types';

import { VmDetailsSummary } from './VmDetailsSummary';
import { initTestI18n } from '../../catalogProvision/test/i18n';

vi.mock('../../../api/v1/instance-types', () => ({
  useInstanceType: vi.fn(),
  formatInstanceTypeDisplayName: (
    instanceType: { metadata?: { name?: string } } | undefined,
    _suffix: string,
    fallbackId?: string,
  ) => instanceType?.metadata?.name ?? fallbackId ?? '—',
}));

const { useInstanceType } = await import('../../../api/v1/instance-types');

const vm = {
  id: 'vm-1',
  spec: { instanceType: 'standard-4-8' },
  status: { publicIpAddress: '203.0.113.1', internalIpAddress: '10.0.0.5' },
} as ComputeInstance;

const renderSummary = async (instance: ComputeInstance = vm) => {
  const i18n = await initTestI18n();
  return render(
    <I18nextProvider i18n={i18n}>
      <VmDetailsSummary vm={instance} />
    </I18nextProvider>,
  );
};

describe('VmDetailsSummary', () => {
  it('shows instance type, public IP, and internal IP cards', async () => {
    vi.mocked(useInstanceType).mockReturnValue({
      data: { id: 'standard-4-8', metadata: { name: 'Standard 4 vCPU / 8 GiB' } },
      isLoading: false,
    } as ReturnType<typeof useInstanceType>);

    await renderSummary();

    expect(screen.getByText('Standard 4 vCPU / 8 GiB')).toBeInTheDocument();
    expect(screen.getByText('203.0.113.1')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.5')).toBeInTheDocument();
  });

  it('falls back to raw instance type id when lookup has no data', async () => {
    vi.mocked(useInstanceType).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useInstanceType>);

    await renderSummary();
    expect(screen.getByText('standard-4-8')).toBeInTheDocument();
  });
});
