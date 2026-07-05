import type { ComponentProps } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ComputeInstance, InstanceType } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';

import { VmTable } from './VmTable';
import { initTestI18n } from '../catalogProvision/test/i18n';

vi.mock('./VmActionsMenu', () => ({
  VmActionsMenu: () => <button type="button">Actions</button>,
}));

vi.mock('./VmInstanceTypeLabel', () => ({
  VmInstanceTypeLabel: ({
    instanceTypeId,
    instanceType,
  }: {
    instanceTypeId?: string;
    instanceType?: { metadata?: { name?: string } };
  }) => <span>{instanceType?.metadata?.name ?? instanceTypeId ?? '—'}</span>,
}));

const standardInstanceType = {
  id: 'standard-4-8',
  metadata: { name: 'Standard 4 vCPU / 8 GiB' },
} as InstanceType;

const runningVm = {
  id: 'vm-1',
  metadata: { name: 'web-01', creationTimestamp: '2024-01-01T00:00:00.000Z' },
  spec: { instanceType: 'standard-4-8' },
  status: {
    state: ComputeInstanceState.RUNNING,
    internalIpAddress: '10.0.0.5',
    publicIpAddress: '203.0.113.1',
  },
} as ComputeInstance;

const renderTable = async (props: Partial<ComponentProps<typeof VmTable>> = {}) => {
  const i18n = await initTestI18n();
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <VmTable vms={[runningVm]} instanceTypes={[standardInstanceType]} {...props} />
      </I18nextProvider>
    </MemoryRouter>,
  );
};

describe('VmTable', () => {
  it('renders updated column headers', async () => {
    await renderTable();

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Instance type' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Internal IP' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'External IP' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Created' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'vCPU' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Memory' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'IP' })).not.toBeInTheDocument();
  });

  it('shows friendly instance type name, split IP addresses, and created timestamp', async () => {
    await renderTable();

    expect(screen.getByText('Standard 4 vCPU / 8 GiB')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.5')).toBeInTheDocument();
    expect(screen.getByText('203.0.113.1')).toBeInTheDocument();
    expect(screen.getByRole('time')).toHaveAttribute('dateTime', '2024-01-01T00:00:00.000Z');
  });

  it('falls back to raw instance type id when lookup data is missing', async () => {
    await renderTable({ instanceTypes: [], isInstanceTypesLoading: false });

    expect(screen.getByText('standard-4-8')).toBeInTheDocument();
  });

  it('links the VM name to its details page', async () => {
    await renderTable();

    expect(screen.getByRole('link', { name: 'web-01' })).toHaveAttribute('href', '/vms/vm-1');
  });

  it('masks IPs and disables the name link while deleting', async () => {
    const deletingVm = {
      ...runningVm,
      status: {
        ...runningVm.status,
        state: ComputeInstanceState.DELETING,
      },
    } as ComputeInstance;

    const i18n = await initTestI18n();
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <VmTable vms={[deletingVm]} instanceTypes={[standardInstanceType]} />
        </I18nextProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'web-01' })).not.toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });
});
