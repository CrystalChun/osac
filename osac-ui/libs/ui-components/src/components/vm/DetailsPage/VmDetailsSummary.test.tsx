import { I18nextProvider } from 'react-i18next';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ComputeInstance, InstanceType } from '@osac/types';

import VmDetailsSummary from './VmDetailsSummary';
import { initTestI18n } from '../../catalogProvision/test/i18n';

vi.mock('../VmInstanceTypeLabel', () => ({
  VmInstanceTypeLabel: ({
    instanceTypeId,
    instanceType,
    sizingFallback,
  }: {
    instanceTypeId?: string;
    instanceType?: { metadata?: { name?: string } };
    sizingFallback?: string;
  }) => <span>{instanceType?.metadata?.name ?? instanceTypeId ?? sizingFallback ?? '—'}</span>,
}));

const vm = {
  id: 'vm-1',
  spec: { instanceType: 'standard-4-8' },
  status: { publicIpAddress: '203.0.113.1', internalIpAddress: '10.0.0.5' },
} as ComputeInstance;

const standardInstanceType = {
  id: 'standard-4-8',
  metadata: { name: 'Standard 4 vCPU / 8 GiB' },
} as InstanceType;

const renderSummary = async (instance: ComputeInstance = vm, instanceType?: InstanceType) => {
  const i18n = await initTestI18n();
  return render(
    <I18nextProvider i18n={i18n}>
      <VmDetailsSummary vm={instance} instanceType={instanceType} />
    </I18nextProvider>,
  );
};

describe('VmDetailsSummary', () => {
  it('shows instance type, public IP, and internal IP cards', async () => {
    await renderSummary(vm, standardInstanceType);

    expect(screen.getByText('Standard 4 vCPU / 8 GiB')).toBeInTheDocument();
    expect(screen.getByText('203.0.113.1')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.5')).toBeInTheDocument();
  });

  it('falls back to raw instance type id when lookup has no data', async () => {
    await renderSummary();
    expect(screen.getByText('standard-4-8')).toBeInTheDocument();
  });

  it('shows cores/memory sizing when instance type is unset', async () => {
    const cliVm = {
      id: 'vm-cli',
      spec: { cores: 1, memoryGib: 2 },
      status: { internalIpAddress: '10.100.1.11' },
    } as ComputeInstance;
    await renderSummary(cliVm);
    expect(screen.getByText('1 vCPU, 2 GiB')).toBeInTheDocument();
  });

  it('shows em dash when neither instance type nor cores/memory is set', async () => {
    const bareVm = {
      id: 'vm-bare',
      spec: {},
      status: {},
    } as ComputeInstance;
    await renderSummary(bareVm);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });
});
