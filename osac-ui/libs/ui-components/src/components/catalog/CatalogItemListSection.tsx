import {
  Bullseye,
  Gallery,
  GalleryItem,
  Spinner,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';

import CatalogItemCard from './CatalogItemCard';
import type { CatalogItem } from './catalogItemDisplay';
import { getErrorMessage } from '../../utils/error';
import QueryErrorState from '../Resource/QueryErrorState';

interface CatalogItemCardAddons {
  scopeBadge?: React.ReactNode;
  statusLabel?: React.ReactNode;
  publishToggle?: React.ReactNode;
}

interface CatalogItemListSectionProps {
  title: string;
  items: CatalogItem[];
  selectedItemId?: string | null;
  onSelectItem: (item: CatalogItem) => void;
  isLoading?: boolean;
  error?: unknown;
  renderCardAddons?: (item: CatalogItem) => CatalogItemCardAddons;
}

export const CatalogItemListSection = ({
  title,
  items,
  selectedItemId = null,
  onSelectItem,
  isLoading = false,
  error = null,
  renderCardAddons,
}: CatalogItemListSectionProps) => {
  if (!isLoading && !error && items.length === 0) {
    return null;
  }

  return (
    <StackItem>
      <Stack hasGutter>
        <StackItem>
          <Title headingLevel="h2" size="lg">
            {title}
          </Title>
        </StackItem>
        {isLoading ? (
          <StackItem>
            <Bullseye>
              <Spinner aria-label={`Loading ${title}`} />
            </Bullseye>
          </StackItem>
        ) : null}
        {error ? (
          <StackItem>
            <QueryErrorState error={error} title={title} body={getErrorMessage(error)} />
          </StackItem>
        ) : null}
        {items.length > 0 ? (
          <StackItem>
            <Gallery hasGutter>
              {items.map((item) => {
                const addons = renderCardAddons?.(item);
                return (
                  <GalleryItem key={item.id}>
                    <CatalogItemCard
                      item={item}
                      isSelected={selectedItemId === item.id}
                      onOpenDetails={() => onSelectItem(item)}
                      scopeBadge={addons?.scopeBadge}
                      statusLabel={addons?.statusLabel}
                      publishToggle={addons?.publishToggle}
                    />
                  </GalleryItem>
                );
              })}
            </Gallery>
          </StackItem>
        ) : null}
      </Stack>
    </StackItem>
  );
};
