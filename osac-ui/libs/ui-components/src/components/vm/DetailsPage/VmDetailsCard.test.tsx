import { I18nextProvider } from 'react-i18next';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ComputeInstance } from '@osac/types';

import VmDetailsCard from './VmDetailsCard';
import { initTestI18n } from '../../catalogProvision/test/i18n';

vi.mock('./useVmDetailsDisplay', () => ({
  useVmDetailsDisplay: vi.fn(),
}));

vi.mock('./VmDetailsCatalogValue', () => ({
  default: ({ catalogItemId }: { catalogItemId?: string }) => <span>{catalogItemId}</span>,
}));

const { useVmDetailsDisplay } = await import('./useVmDetailsDisplay');

const catalogVm = {
  id: 'vm-1',
  metadata: { name: 'web-01', creator: 'alice', creationTimestamp: '2026-01-01T00:00:00Z' },
  spec: {
    catalogItem: 'catalog-rhel-9',
    sshKey: 'ssh-rsa AAAA...',
    image: { sourceRef: 'quay.io/example/rhel9' },
    instanceType: 'standard-4-8',
    bootDisk: { sizeGib: 40 },
    userData: '#cloud-config',
  },
} as ComputeInstance;

const renderCard = async (vm: ComputeInstance = catalogVm) => {
  const i18n = await initTestI18n();
  return render(
    <I18nextProvider i18n={i18n}>
      <VmDetailsCard vm={vm} />
    </I18nextProvider>,
  );
};

describe('VmDetailsCard', () => {
  it('shows catalog fields with full SSH key', async () => {
    vi.mocked(useVmDetailsDisplay).mockReturnValue({
      catalogItemId: 'catalog-rhel-9',
      hasCatalogItem: true,
      isCatalogItemLoading: false,
      instanceType: {
        id: 'standard-4-8',
        metadata: { name: 'Standard 4 vCPU / 8 GiB' },
        spec: { cores: 4, memoryGib: 8 },
      },
      instanceTypeId: 'standard-4-8',
      isInstanceTypeLoading: false,
      fieldLabels: {
        sshKey: 'SSH public key',
        image: 'VM image',
        bootDisk: 'Boot disk',
        userData: 'User Data',
      },
      networkingRows: [],
      catalogItem: undefined,
    });

    await renderCard();

    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('web-01')).toBeInTheDocument();
    expect(screen.getByText('ssh-rsa AAAA...')).toBeInTheDocument();
    expect(screen.getByText('40 GB')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.queryByText('User Data')).not.toBeInTheDocument();
    expect(screen.queryByText('Run strategy')).not.toBeInTheDocument();
    expect(screen.queryByText('Tenants')).not.toBeInTheDocument();
    expect(screen.queryByText('Version')).not.toBeInTheDocument();
    expect(screen.queryByText('Creators')).not.toBeInTheDocument();
    expect(screen.getByText('Creator')).toBeInTheDocument();
  });

  it('shows degraded message when catalog item is missing', async () => {
    vi.mocked(useVmDetailsDisplay).mockReturnValue({
      catalogItemId: undefined,
      hasCatalogItem: false,
      isCatalogItemLoading: false,
      instanceType: undefined,
      instanceTypeId: undefined,
      isInstanceTypeLoading: false,
      fieldLabels: {
        sshKey: 'SSH public key',
        image: 'VM image',
        bootDisk: 'Boot disk',
        userData: 'User Data',
      },
      networkingRows: [],
      catalogItem: undefined,
    });

    await renderCard({ id: 'vm-2', metadata: { name: 'legacy-vm' } } as ComputeInstance);
    expect(
      screen.getByText('Catalog configuration is unavailable for this virtual machine.'),
    ).toBeInTheDocument();
    expect(screen.getByText('legacy-vm')).toBeInTheDocument();
    expect(screen.queryByText('SSH public key')).not.toBeInTheDocument();
  });
});
