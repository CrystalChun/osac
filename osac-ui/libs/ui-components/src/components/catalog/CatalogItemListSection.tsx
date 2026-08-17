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
import type { CatalogItemWithType } from './catalogItemDisplay';
import { getErrorMessage } from '../../utils/error';
import QueryErrorState from '../Resource/QueryErrorState';

interface CatalogItemListSectionProps {
  title?: string;
  items: CatalogItemWithType[];
  onSelectItem: (item: CatalogItemWithType) => void;
  isLoading?: boolean;
  error?: unknown;
}

export const CatalogItemListSection = ({
  title,
  items,
  onSelectItem,
  isLoading = false,
  error = null,
}: CatalogItemListSectionProps) => {
  if (!isLoading && !error && items.length === 0) {
    return null;
  }

  return (
    <StackItem>
      <Stack hasGutter>
        {title ? (
          <StackItem>
            <Title headingLevel="h2" size="lg">
              {title}
            </Title>
          </StackItem>
        ) : null}
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
            <Gallery hasGutter minWidths={{ default: '400px' }} maxWidths={{ default: '400px' }}>
              {items.map((item) => (
                <GalleryItem key={item.id}>
                  <CatalogItemCard
                    item={item}
                    type={item.type}
                    onOpenDetails={() => onSelectItem(item)}
                  />
                </GalleryItem>
              ))}
            </Gallery>
          </StackItem>
        ) : null}
      </Stack>
    </StackItem>
  );
};
