import {
  Alert,
  Bullseye,
  Gallery,
  GalleryItem,
  Spinner,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';

import CatalogItemCard from './CatalogItemCard';
import type { CatalogItemForDisplay, CatalogItemKind } from './catalogItemDisplay';
import { getErrorMessage } from '../../utils/error';

interface CatalogItemListSectionProps {
  title: string;
  kind: CatalogItemKind;
  items: CatalogItemForDisplay[];
  selectedItemId?: string | null;
  onSelectItem: (item: CatalogItemForDisplay) => void;
  isLoading?: boolean;
  error?: unknown;
}

export const CatalogItemListSection = ({
  title,
  kind,
  items,
  selectedItemId = null,
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
            <Alert variant="danger" title={title} isInline>
              {getErrorMessage(error)}
            </Alert>
          </StackItem>
        ) : null}
        {items.length > 0 ? (
          <StackItem>
            <Gallery
              hasGutter
              minWidths={{ default: '200px', md: '240px', lg: '260px', xl: '280px' }}
              maxWidths={{ md: '280px', lg: '320px', xl: '360px' }}
            >
              {items.map((item) => (
                <GalleryItem key={item.id}>
                  <CatalogItemCard
                    item={item}
                    kind={kind}
                    isBrowseSelected={selectedItemId === item.id}
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
