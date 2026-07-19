import type { ComponentProps } from 'react';
import { I18nextProvider } from 'react-i18next';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { InstanceType } from '@osac/types';

import { VmInstanceTypeLabel } from './VmInstanceTypeLabel';
import { initTestI18n } from '../catalogProvision/test/i18n';

vi.mock('../../api/v1/instance-types', () => ({
  formatInstanceTypeDisplayName: (
    instanceType: { metadata?: { name?: string } } | undefined,
    _suffix: string,
    fallbackId?: string,
  ) => instanceType?.metadata?.name ?? fallbackId ?? '—',
}));

const standardInstanceType = {
  id: 'standard-4-8',
  metadata: { name: 'Standard 4 vCPU / 8 GiB' },
} as InstanceType;

const renderLabel = async (props: ComponentProps<typeof VmInstanceTypeLabel>) => {
  const i18n = await initTestI18n();
  return render(
    <I18nextProvider i18n={i18n}>
      <VmInstanceTypeLabel {...props} />
    </I18nextProvider>,
  );
};

describe('VmInstanceTypeLabel', () => {
  it('shows friendly name when instance type is provided', async () => {
    await renderLabel({
      instanceTypeId: 'standard-4-8',
      instanceType: standardInstanceType,
    });

    expect(screen.getByText('Standard 4 vCPU / 8 GiB')).toBeInTheDocument();
  });

  it('falls back to raw id when instance type is missing', async () => {
    await renderLabel({ instanceTypeId: 'standard-4-8' });

    expect(screen.getByText('standard-4-8')).toBeInTheDocument();
  });

  it('shows em dash when instance type id is unset', async () => {
    await renderLabel({});

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows skeleton while loading when instance type id is set', async () => {
    const { container } = await renderLabel({ instanceTypeId: 'standard-4-8', isLoading: true });

    expect(container.querySelector('.pf-v6-c-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('standard-4-8')).not.toBeInTheDocument();
  });

  it('does not show skeleton while loading when instance type id is unset', async () => {
    const { container } = await renderLabel({ isLoading: true });

    expect(container.querySelector('.pf-v6-c-skeleton')).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

});
