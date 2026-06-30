import { I18nextProvider } from 'react-i18next';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ComputeInstance } from '@osac/types';

import VmNetworkingTab from './VmNetworkingTab';
import { initTestI18n } from '../../catalogProvision/test/i18n';

vi.mock('./useVmDetailsDisplay', () => ({
  useVmDetailsDisplay: vi.fn(),
}));

const { useVmDetailsDisplay } = await import('./useVmDetailsDisplay');

const renderTab = async (vm: ComputeInstance) => {
  const i18n = await initTestI18n();
  return render(
    <I18nextProvider i18n={i18n}>
      <VmNetworkingTab vm={vm} />
    </I18nextProvider>,
  );
};

describe('VmNetworkingTab', () => {
  it('renders resolved networking names', async () => {
    vi.mocked(useVmDetailsDisplay).mockReturnValue({
      networkingRows: [
        {
          virtualNetwork: 'prod-vn',
          subnet: 'prod-subnet',
          securityGroups: 'web-sg, default-sg',
        },
      ],
      catalogItemId: 'catalog-rhel-9',
      hasCatalogItem: true,
      isCatalogItemLoading: false,
      instanceType: undefined,
      instanceTypeId: undefined,
      isInstanceTypeLoading: false,
      fieldLabels: {
        sshKey: '',
        image: '',
        bootDisk: '',
        userData: '',
      },
      catalogItem: undefined,
    });

    const vm = {
      id: 'vm-1',
      spec: {
        networkAttachments: [{ subnet: 'subnet-1', securityGroups: ['sg-1', 'sg-2'] }],
      },
    } as ComputeInstance;

    await renderTab(vm);

    expect(screen.getByText('prod-vn')).toBeInTheDocument();
    expect(screen.getByText('prod-subnet')).toBeInTheDocument();
    expect(screen.getByText('web-sg, default-sg')).toBeInTheDocument();
  });

  it('shows empty state when there are no attachments', async () => {
    vi.mocked(useVmDetailsDisplay).mockReturnValue({
      networkingRows: [],
      catalogItemId: undefined,
      hasCatalogItem: false,
      isCatalogItemLoading: false,
      instanceType: undefined,
      instanceTypeId: undefined,
      isInstanceTypeLoading: false,
      fieldLabels: {
        sshKey: '',
        image: '',
        bootDisk: '',
        userData: '',
      },
      catalogItem: undefined,
    });

    await renderTab({ id: 'vm-1', spec: {} } as ComputeInstance);
    expect(screen.getByText('No virtual networks configured.')).toBeInTheDocument();
  });
});
