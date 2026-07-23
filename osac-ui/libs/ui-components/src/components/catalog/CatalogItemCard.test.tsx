import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types';

import CatalogItemCard from './CatalogItemCard';
import { renderWithProviders } from '../../test-utils/TestProviders';
import CatalogItemPublishToggle from '../catalogManagement/CatalogItemPublishToggle';
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
  it('omits scope badge, status label, and publish toggle by default (tenant mode)', () => {
    renderWithProviders(<CatalogItemCard item={item} onOpenDetails={() => {}} />);
    expect(screen.queryByText('General')).not.toBeInTheDocument();
    expect(screen.queryByText('Published')).not.toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('renders scope badge, status label, and publish toggle when provided (admin mode)', () => {
    renderWithProviders(
      <CatalogItemCard
        item={item}
        onOpenDetails={() => {}}
        scopeBadge={<CatalogItemScopeBadge scope={{ level: 'general' }} />}
        statusLabel={<CatalogItemStatusLabel published />}
        publishToggle={<CatalogItemPublishToggle published onChange={() => {}} />}
      />,
    );
    expect(screen.getByText('General')).toBeInTheDocument();
    // "Published" appears twice: once from the status label, once as the switch's own accessible label.
    expect(screen.getAllByText('Published')).toHaveLength(2);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('still navigates to details when the card is clicked (regression)', async () => {
    const onOpenDetails = vi.fn();
    const { user } = renderWithProviders(
      <CatalogItemCard
        item={item}
        onOpenDetails={onOpenDetails}
        publishToggle={<CatalogItemPublishToggle published onChange={() => {}} />}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: `Open catalog item details for ${item.title}` }),
    );

    expect(onOpenDetails).toHaveBeenCalled();
  });

  it('does not navigate to details when the publish toggle is clicked', async () => {
    const onOpenDetails = vi.fn();
    const onTogglePublished = vi.fn();
    const { user } = renderWithProviders(
      <CatalogItemCard
        item={item}
        onOpenDetails={onOpenDetails}
        publishToggle={<CatalogItemPublishToggle published onChange={onTogglePublished} />}
      />,
    );

    await user.click(screen.getByRole('switch'));

    expect(onTogglePublished).toHaveBeenCalledWith(false);
    expect(onOpenDetails).not.toHaveBeenCalled();
  });
});
