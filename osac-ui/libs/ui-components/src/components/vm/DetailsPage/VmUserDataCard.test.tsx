import { I18nextProvider } from 'react-i18next';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComputeInstance } from '@osac/types';

import VmUserDataCard from './VmUserDataCard';
import { initTestI18n } from '../../catalogProvision/test/i18n';

vi.mock('./useVmDetailsDisplay', () => ({
  useVmDetailsDisplay: vi.fn(),
}));

const { useVmDetailsDisplay } = await import('./useVmDetailsDisplay');

const catalogVm = {
  id: 'vm-1',
  spec: {
    catalogItem: 'catalog-rhel-9',
    userData: '#cloud-config\nusers: []',
  },
} as ComputeInstance;

const renderCard = async (vm: ComputeInstance = catalogVm) => {
  const i18n = await initTestI18n();
  const view = render(
    <I18nextProvider i18n={i18n}>
      <VmUserDataCard vm={vm} />
    </I18nextProvider>,
  );
  return { ...view, user: userEvent.setup() };
};

describe('VmUserDataCard', () => {
  beforeEach(() => {
    vi.mocked(useVmDetailsDisplay).mockReturnValue({
      hasCatalogItem: true,
      fieldLabels: { userData: 'User Data', sshKey: '', image: '', bootDisk: '' },
      catalogItemId: 'catalog-rhel-9',
      isCatalogItemLoading: false,
      instanceType: undefined,
      instanceTypeId: undefined,
      isInstanceTypeLoading: false,
      networkingRows: [],
      catalogItem: undefined,
    });
  });

  it('renders nothing when user data is empty', async () => {
    const { container } = await renderCard({
      id: 'vm-1',
      spec: { catalogItem: 'catalog-rhel-9', userData: '   ' },
    } as ComputeInstance);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when catalog item is missing', async () => {
    vi.mocked(useVmDetailsDisplay).mockReturnValue({
      hasCatalogItem: false,
      fieldLabels: { userData: 'User Data', sshKey: '', image: '', bootDisk: '' },
      catalogItemId: undefined,
      isCatalogItemLoading: false,
      instanceType: undefined,
      instanceTypeId: undefined,
      isInstanceTypeLoading: false,
      networkingRows: [],
      catalogItem: undefined,
    });
    const { container } = await renderCard({
      id: 'vm-1',
      spec: { userData: '#cloud-config' },
    } as ComputeInstance);
    expect(container).toBeEmptyDOMElement();
  });

  it('is collapsed by default and reveals content on expand', async () => {
    const { user } = await renderCard();

    expect(screen.getByText('Cloud Init User Data')).toBeInTheDocument();
    expect(screen.queryByText(/#cloud-config/)).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: /Expand user data/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(screen.getByText(/#cloud-config/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Collapse user data/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});
