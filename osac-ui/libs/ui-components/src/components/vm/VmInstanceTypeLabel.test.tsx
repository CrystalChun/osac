import type { ComponentProps } from 'react';
import { I18nextProvider } from 'react-i18next';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { InstanceType } from '@osac/types';

import { VmInstanceTypeLabel } from './VmInstanceTypeLabel';
import { initTestI18n } from '../catalogProvision/test/i18n';

vi.mock('../../api/v1/instance-types', () => ({
  useInstanceType: vi.fn(),
  formatInstanceTypeDisplayName: (
    instanceType: { metadata?: { name?: string } } | undefined,
    _suffix: string,
    fallbackId?: string,
  ) => instanceType?.metadata?.name ?? fallbackId ?? '—',
}));

const { useInstanceType } = await import('../../api/v1/instance-types');

const standardInstanceType = {
  id: 'standard-4-8',
  metadata: { name: 'Standard 4 vCPU / 8 GiB' },
} as InstanceType;

const defaultQueryResult = {
  data: undefined,
  isLoading: false,
} as ReturnType<typeof useInstanceType>;

const renderLabel = async (props: ComponentProps<typeof VmInstanceTypeLabel>) => {
  const i18n = await initTestI18n();
  return render(
    <I18nextProvider i18n={i18n}>
      <VmInstanceTypeLabel {...props} />
    </I18nextProvider>,
  );
};

describe('VmInstanceTypeLabel', () => {
  beforeEach(() => {
    vi.mocked(useInstanceType).mockReturnValue(defaultQueryResult);
  });

  it('shows friendly name when instance type is preloaded', async () => {
    await renderLabel({
      instanceTypeId: 'standard-4-8',
      instanceType: standardInstanceType,
      isLoading: false,
    });

    expect(screen.getByText('Standard 4 vCPU / 8 GiB')).toBeInTheDocument();
    expect(useInstanceType).toHaveBeenCalledWith(undefined);
  });

  it('falls back to raw id when preloaded lookup has no match', async () => {
    await renderLabel({
      instanceTypeId: 'standard-4-8',
      isLoading: false,
    });

    expect(screen.getByText('standard-4-8')).toBeInTheDocument();
  });

  it('shows spinner while preloaded list is loading', async () => {
    await renderLabel({
      instanceTypeId: 'standard-4-8',
      isLoading: true,
    });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows em dash when instance type id is unset', async () => {
    await renderLabel({ isLoading: false });

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('fetches instance type when not in preloaded mode', async () => {
    vi.mocked(useInstanceType).mockReturnValue({
      data: standardInstanceType,
      isLoading: false,
    } as ReturnType<typeof useInstanceType>);

    await renderLabel({ instanceTypeId: 'standard-4-8' });

    expect(screen.getByText('Standard 4 vCPU / 8 GiB')).toBeInTheDocument();
    expect(useInstanceType).toHaveBeenCalledWith('standard-4-8');
  });

  it('shows spinner while fetching in fetch mode', async () => {
    vi.mocked(useInstanceType).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useInstanceType>);

    await renderLabel({ instanceTypeId: 'standard-4-8' });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
