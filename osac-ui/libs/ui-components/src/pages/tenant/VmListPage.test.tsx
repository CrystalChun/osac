import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComputeInstance } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';

import { VmListPage } from './VmListPage';
import { initTestI18n } from '../../components/catalogProvision/test/i18n';

vi.mock('@osac/ui-components/api/v1/compute-instance', () => ({
  useComputeInstances: vi.fn(),
}));

vi.mock('@osac/ui-components/api/v1/instance-types', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@osac/ui-components/api/v1/instance-types')>();
  return {
    ...actual,
    useInstanceTypes: vi.fn(),
  };
});

vi.mock('../../components/vm/VmActionsMenu', () => ({
  VmActionsMenu: () => <button type="button">Actions</button>,
}));

vi.mock('../../components/vm/VmInstanceTypeLabel', () => ({
  VmInstanceTypeLabel: ({
    instanceTypeId,
    instanceType,
  }: {
    instanceTypeId?: string;
    instanceType?: { metadata?: { name?: string } };
  }) => <span>{instanceType?.metadata?.name ?? instanceTypeId ?? '—'}</span>,
}));

vi.mock('@osac/ui-components/hooks/use-session', () => ({
  useSession: vi.fn(() => ({ role: 'tenantUser' })),
}));

const { useComputeInstances } = await import('@osac/ui-components/api/v1/compute-instance');
const { useInstanceTypes } = await import('@osac/ui-components/api/v1/instance-types');

const vm = {
  id: 'vm-1',
  metadata: { name: 'web-01' },
  spec: { instanceType: 'standard-4-8' },
  status: {
    state: ComputeInstanceState.RUNNING,
    internalIpAddress: '10.0.0.5',
    publicIpAddress: '203.0.113.1',
  },
} as ComputeInstance;

const renderPage = async () => {
  const i18n = await initTestI18n();
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <VmListPage />
      </I18nextProvider>
    </MemoryRouter>,
  );
};

describe('VmListPage', () => {
  beforeEach(() => {
    vi.mocked(useComputeInstances).mockReturnValue({
      data: [vm],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useComputeInstances>);

    vi.mocked(useInstanceTypes).mockReturnValue({
      data: [{ id: 'standard-4-8', metadata: { name: 'Standard 4 vCPU / 8 GiB' } }],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useInstanceTypes>);
  });

  it('shows an alert and still renders the table when instance types fail to load', async () => {
    vi.mocked(useInstanceTypes).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Instance types unavailable'),
    } as ReturnType<typeof useInstanceTypes>);

    await renderPage();

    expect(screen.getByText('Could not load instance types')).toBeInTheDocument();
    expect(screen.getByText('Instance types unavailable')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'web-01' })).toBeInTheDocument();
    expect(screen.getByText('standard-4-8')).toBeInTheDocument();
  });

  it('keeps compute instance failures on the page-level error path', async () => {
    vi.mocked(useComputeInstances).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('VMs unavailable'),
    } as ReturnType<typeof useComputeInstances>);

    await renderPage();

    expect(screen.getByText('An error occurred')).toBeInTheDocument();
    expect(screen.getByText('VMs unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'web-01' })).not.toBeInTheDocument();
  });
});
