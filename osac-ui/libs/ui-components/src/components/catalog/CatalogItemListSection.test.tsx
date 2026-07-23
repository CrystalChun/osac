import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types';

import { CatalogItemListSection } from './CatalogItemListSection';
import { renderWithProviders } from '../../test-utils/TestProviders';

const items: ClusterCatalogItem[] = [
  {
    $typeName: 'osac.public.v1.ClusterCatalogItem',
    id: 'catalog-1',
    title: 'OpenShift 4 cluster',
    description: '',
    template: '',
    published: true,
    fieldDefinitions: [],
  },
];

describe('CatalogItemListSection', () => {
  it('renders no addons when renderCardAddons is omitted (tenant mode)', () => {
    renderWithProviders(
      <CatalogItemListSection title="Clusters" items={items} onSelectItem={() => {}} />,
    );
    expect(screen.queryByText('addon-marker')).not.toBeInTheDocument();
  });

  it('threads renderCardAddons output through to each card', () => {
    renderWithProviders(
      <CatalogItemListSection
        title="Clusters"
        items={items}
        onSelectItem={() => {}}
        renderCardAddons={() => ({
          scopeBadge: <span>scope-marker</span>,
          statusLabel: <span>status-marker</span>,
          publishToggle: <span>toggle-marker</span>,
        })}
      />,
    );
    expect(screen.getByText('scope-marker')).toBeInTheDocument();
    expect(screen.getByText('status-marker')).toBeInTheDocument();
    expect(screen.getByText('toggle-marker')).toBeInTheDocument();
  });
});
