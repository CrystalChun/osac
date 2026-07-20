import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ComputeInstance } from '@osac/types';

import VmNetworkingTab from './VmNetworkingTab';
import { renderWithProviders } from '../../../test-utils/TestProviders';

vi.mock('./useVmDetailsDisplay', () => ({
  useVmDetailsDisplay: vi.fn(),
}));

const { useVmDetailsDisplay } = await import('./useVmDetailsDisplay');

const renderTab = (vm: ComputeInstance) => renderWithProviders(<VmNetworkingTab vm={vm} />);

describe('VmNetworkingTab', () => {
  it('renders resolved networking names', () => {
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

    renderTab(vm);

    expect(screen.getByText('prod-vn')).toBeInTheDocument();
    expect(screen.getByText('prod-subnet')).toBeInTheDocument();
    expect(screen.getByText('web-sg, default-sg')).toBeInTheDocument();
  });

  it('shows empty state when there are no attachments', () => {
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

    renderTab({ id: 'vm-1', spec: {} } as ComputeInstance);
    expect(screen.getByText('No virtual networks configured.')).toBeInTheDocument();
  });
});
