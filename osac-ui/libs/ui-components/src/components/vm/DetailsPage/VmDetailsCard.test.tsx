import { create } from '@bufbuild/protobuf';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  ComputeInstance,
  ComputeInstanceCatalogItemReferenceSchema,
  ComputeInstanceTemplateReferenceSchema,
  InstanceTypeReferenceSchema,
  InstanceTypeState,
} from '@osac/types';

import VmDetailsCard from './VmDetailsCard';
import { renderWithProviders } from '../../../test-utils/TestProviders';

vi.mock('./useVmDetailsDisplay', () => ({
  useVmDetailsDisplay: vi.fn(),
}));

const { useVmDetailsDisplay } = await import('./useVmDetailsDisplay');

const catalogVm: ComputeInstance = {
  $typeName: 'osac.public.v1.ComputeInstance',
  id: 'vm-1',
  metadata: {
    $typeName: 'osac.public.v1.Metadata',
    displayName: '',
    description: '',
    name: 'web-01',
    creator: 'alice',
    creationTimestamp: {
      $typeName: 'google.protobuf.Timestamp',
      seconds: 1767225600n,
      nanos: 0,
    },
    annotations: {},
    labels: {},
    project: 'foo',
    tenant: 'foo',
    version: 1,
  },
  spec: {
    $typeName: 'osac.public.v1.ComputeInstanceSpec',
    catalogItem: create(ComputeInstanceCatalogItemReferenceSchema, {
      id: 'catalog-rhel-9',
      name: 'RHEL 9 catalog',
    }),
    sshPublicKey: 'ssh-rsa AAAA...',
    instanceType: create(InstanceTypeReferenceSchema, { id: 'standard-4-8' }),
    bootDisk: {
      $typeName: 'osac.public.v1.ComputeInstanceDisk',
      sizeGib: 40,
      storageTier: { $typeName: 'osac.public.v1.StorageTierReference', id: '', name: 'balanced' },
    },
    userData: '#cloud-config',
    additionalDisks: [],
    networkAttachments: [],
    template: create(ComputeInstanceTemplateReferenceSchema, { id: '' }),
    templateParameters: {},
    autoExternalIpAttachment: false,
  },
};

const renderCard = (vm: ComputeInstance = catalogVm) =>
  renderWithProviders(<VmDetailsCard vm={vm} />);

describe('VmDetailsCard', () => {
  it('shows catalog fields with full SSH key', () => {
    vi.mocked(useVmDetailsDisplay).mockReturnValue({
      hasCatalogItem: true,
      catalogItemName: 'RHEL 9 catalog',
      instanceType: {
        $typeName: 'osac.public.v1.InstanceType',
        id: 'standard-4-8',
        metadata: {
          $typeName: 'osac.public.v1.Metadata',
          displayName: '',
          description: '',
          name: 'Standard 4 vCPU / 8 GiB',
          annotations: {},
          creator: 'foo',
          labels: {},
          project: 'foo',
          tenant: 'foo',
          version: 1,
        },
        spec: {
          $typeName: 'osac.public.v1.InstanceTypeSpec',
          description: '',
          state: InstanceTypeState.ACTIVE,
          cores: 4,
          memoryGib: 8,
        },
      },
      instanceTypeId: 'standard-4-8',
      isInstanceTypeLoading: false,
      networkingRows: [],
    });

    renderCard();

    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('RHEL 9 catalog')).toBeInTheDocument();
    expect(screen.getByText('web-01')).toBeInTheDocument();
    expect(screen.getByText('ssh-rsa AAAA...')).toBeInTheDocument();
    expect(screen.getByText('40 GB, balanced')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.queryByText('User Data')).not.toBeInTheDocument();
    expect(screen.queryByText('Run strategy')).not.toBeInTheDocument();
    expect(screen.queryByText('Tenants')).not.toBeInTheDocument();
    expect(screen.queryByText('Version')).not.toBeInTheDocument();
    expect(screen.queryByText('Creators')).not.toBeInTheDocument();
    expect(screen.getByText('Creator')).toBeInTheDocument();
  });

  it('shows degraded message when catalog item is missing', () => {
    vi.mocked(useVmDetailsDisplay).mockReturnValue({
      catalogItemName: '',
      hasCatalogItem: false,
      instanceType: undefined,
      instanceTypeId: undefined,
      isInstanceTypeLoading: false,
      networkingRows: [],
    });

    renderCard({ id: 'vm-2', metadata: { name: 'legacy-vm' } } as ComputeInstance);
    expect(
      screen.getByText('Catalog configuration is unavailable for this virtual machine.'),
    ).toBeInTheDocument();
    expect(screen.getByText('legacy-vm')).toBeInTheDocument();
    expect(screen.queryByText('SSH public key')).not.toBeInTheDocument();
  });

  it('lists each additional disk with its resolved tier and exposes no edit control', () => {
    const vmWithAdditionalDisks = {
      ...catalogVm,
      spec: {
        ...catalogVm.spec,
        additionalDisks: [
          { sizeGib: 100, storageTier: { name: 'fast' } },
          { sizeGib: 20, storageTier: { name: 'legacy-tier' } },
        ],
      },
    } as ComputeInstance;

    vi.mocked(useVmDetailsDisplay).mockReturnValue({
      catalogItemName: 'RHEL 9 catalog',
      hasCatalogItem: true,
      instanceType: undefined,
      instanceTypeId: 'standard-4-8',
      isInstanceTypeLoading: false,
      networkingRows: [],
    });

    renderCard(vmWithAdditionalDisks);

    expect(screen.getByText('40 GB, balanced')).toBeInTheDocument();
    expect(screen.getByText('Additional disk 1')).toBeInTheDocument();
    expect(screen.getByText('100 GB, fast')).toBeInTheDocument();
    expect(screen.getByText('Additional disk 2')).toBeInTheDocument();
    expect(screen.getByText('20 GB, legacy-tier')).toBeInTheDocument();
    expect(screen.queryAllByRole('combobox')).toHaveLength(0);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
