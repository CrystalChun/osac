import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComputeInstance } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';

import VmDetails from './VmDetails';
import { initTestI18n } from '../../catalogProvision/test/i18n';

vi.mock('../../../api/v1/instance-types', () => ({
  useInstanceType: vi.fn(),
}));

vi.mock('./VmDetailsActionButtons', () => ({
  default: () => <div>Action buttons</div>,
}));

vi.mock('./VmDetailsSummary', () => ({
  default: () => <div>VM summary</div>,
}));

vi.mock('./VmDetailsOverviewTab', () => ({
  default: () => <div>Overview tab</div>,
}));

vi.mock('./VmNetworkingTab', () => ({
  default: () => <div>Networking tab</div>,
}));

vi.mock('../../Resource/ResourceDetailHeader', () => ({
  ResourceDetailHeader: ({ resourceName }: { resourceName: string }) => <h1>{resourceName}</h1>,
}));

vi.mock('../../../VmStatusLabel', () => ({
  VmStatusLabel: () => <span>Running</span>,
}));

const { useInstanceType } = await import('../../../api/v1/instance-types');

const vm = {
  id: 'vm-1',
  metadata: { name: 'web-01' },
  spec: { instanceType: 'standard-4-8' },
  status: { state: ComputeInstanceState.RUNNING },
} as ComputeInstance;

const renderDetails = async () => {
  const i18n = await initTestI18n();
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <VmDetails vm={vm} />
      </I18nextProvider>
    </MemoryRouter>,
  );
};

describe('VmDetails', () => {
  beforeEach(() => {
    vi.mocked(useInstanceType).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useInstanceType>);
  });

  it('shows an alert and still renders the page when instance type lookup fails', async () => {
    vi.mocked(useInstanceType).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Instance type unavailable'),
    } as ReturnType<typeof useInstanceType>);

    await renderDetails();

    expect(screen.getByText('Could not load instance types')).toBeInTheDocument();
    expect(screen.getByText('Instance type unavailable')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'web-01' })).toBeInTheDocument();
    expect(screen.getByText('VM summary')).toBeInTheDocument();
  });
});
