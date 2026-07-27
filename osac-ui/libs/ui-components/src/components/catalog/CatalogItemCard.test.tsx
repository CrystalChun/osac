import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types';

import CatalogItemCard from './CatalogItemCard';
import { renderWithProviders } from '../../test-utils/TestProviders';
import CatalogItemScopeBadge from '../catalogManagement/CatalogItemScopeBadge';
import CatalogItemStatusLabel from '../catalogManagement/CatalogItemStatusLabel';

const item: ClusterCatalogItem = {
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'catalog-1',
  title: 'OpenShift 4 cluster',
  description: 'Standard OpenShift cluster offering',
  template: '',
  published: true,
  fieldDefinitions: [],
};

describe('CatalogItemCard', () => {
  it('omits scope badge and status label by default (tenant mode)', () => {
    renderWithProviders(<CatalogItemCard item={item} onOpenDetails={() => {}} />);
    expect(screen.queryByText('General')).not.toBeInTheDocument();
    expect(screen.queryByText('Published')).not.toBeInTheDocument();
  });

  it('renders scope badge and status label when provided (admin mode)', () => {
    renderWithProviders(
      <CatalogItemCard
        item={item}
        onOpenDetails={() => {}}
        scopeBadge={<CatalogItemScopeBadge scope={{ level: 'general' }} />}
        statusLabel={<CatalogItemStatusLabel published />}
      />,
    );
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('navigates to details when the card is clicked', async () => {
    const onOpenDetails = vi.fn();
    const { user } = renderWithProviders(
      <CatalogItemCard item={item} onOpenDetails={onOpenDetails} />,
    );

    await user.click(
      screen.getByRole('button', { name: `Open catalog item details for ${item.title}` }),
    );

    expect(onOpenDetails).toHaveBeenCalled();
  });
});
