import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ComputeInstance } from '@osac/types';

import VmStorageCard from './VmStorageCard';
import { renderWithProviders } from '../../../test-utils/TestProviders';

vi.mock('./useVmDetailsDisplay', () => ({
  useVmDetailsDisplay: vi.fn(),
}));

const { useVmDetailsDisplay } = await import('./useVmDetailsDisplay');

describe('VmStorageCard', () => {
  it('lists the boot disk and additional disks with their storage properties', () => {
    vi.mocked(useVmDetailsDisplay).mockReturnValue({
      bootDiskTierDisplay: 'Balanced',
      additionalDiskRows: [
        { sizeGib: '100', tierDisplay: 'Fast SSD' },
        { sizeGib: '20', tierDisplay: 'Capacity' },
      ],
      catalogItemId: undefined,
      hasCatalogItem: false,
      isCatalogItemLoading: false,
      instanceType: undefined,
      instanceTypeId: undefined,
      isInstanceTypeLoading: false,
      fieldLabels: {
        sshPublicKey: '',
        image: '',
        bootDisk: '',
        userData: '',
      },
      networkingRows: [],
      catalogItem: undefined,
    });

    renderWithProviders(
      <VmStorageCard
        vm={
          {
            id: 'vm-1',
            spec: { bootDisk: { sizeGib: 40 } },
          } as ComputeInstance
        }
      />,
    );

    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Size' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Storage tier' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Boot disk' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '40 GB' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Balanced' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Additional disk 1' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '100 GB' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Fast SSD' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Additional disk 2' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '20 GB' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Capacity' })).toBeInTheDocument();
  });
});
