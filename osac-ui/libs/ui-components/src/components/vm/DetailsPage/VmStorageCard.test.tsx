import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import VmStorageCard from './VmStorageCard';
import { renderWithProviders } from '../../../test-utils/TestProviders';

describe('VmStorageCard', () => {
  it('lists the boot disk and additional disks with their storage properties', () => {
    renderWithProviders(
      <VmStorageCard
        storageRows={[
          { name: 'Boot disk', size: '40 GB', storageTier: 'Balanced' },
          { name: 'Additional disk 1', size: '100 GB', storageTier: 'Fast SSD' },
          { name: 'Additional disk 2', size: '20 GB', storageTier: 'Capacity' },
        ]}
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
