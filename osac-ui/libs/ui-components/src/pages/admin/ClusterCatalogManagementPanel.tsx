import { useNavigate } from 'react-router-dom';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  SearchInput,
  Stack,
  StackItem,
  Title,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';

import { useClusterCatalogItems } from '@osac/ui-components/api/v1/cluster-catalog-item';
import { usePrivateClusterCatalogItems } from '@osac/ui-components/api/v1/private/cluster-catalog-item';
import CatalogItemCard from '@osac/ui-components/components/catalog/CatalogItemCard';
import {
  type PublicationFilter,
  catalogItemScope,
  filterCatalogItemsBySearch,
  matchesPublicationFilter,
} from '@osac/ui-components/components/catalog/catalogItemDisplay';
import CatalogItemScopeBadge from '@osac/ui-components/components/catalogManagement/CatalogItemScopeBadge';
import CatalogItemStatusLabel from '@osac/ui-components/components/catalogManagement/CatalogItemStatusLabel';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import type { DemoShellRole } from '@osac/ui-components/shellTypes';

interface ClusterCatalogManagementPanelProps {
  isActive: boolean;
  search: string;
  setSearch: (value: string) => void;
  publicationFilter: PublicationFilter;
  setPublicationFilter: (value: PublicationFilter) => void;
  role: DemoShellRole;
}

const ClusterCatalogManagementPanel = ({
  isActive,
  search,
  setSearch,
  publicationFilter,
  setPublicationFilter,
  role,
}: ClusterCatalogManagementPanelProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isProviderAdmin = role === 'providerAdmin';
  const publicResult = useClusterCatalogItems(undefined, isActive && !isProviderAdmin);
  const privateResult = usePrivateClusterCatalogItems(undefined, isActive && isProviderAdmin);
  const { data = [], isLoading, error, isSuccess } = isProviderAdmin ? privateResult : publicResult;

  const filteredItems = filterCatalogItemsBySearch(data, search).filter((item) =>
    matchesPublicationFilter(item, publicationFilter),
  );

  const publicationFilters: ReadonlyArray<{ value: PublicationFilter; label: string }> = [
    { value: 'all', label: t('All') },
    { value: 'published', label: t('Published') },
    { value: 'unpublished', label: t('Unpublished') },
  ];

  const isFiltered = search.trim().length > 0 || publicationFilter !== 'all';
  // `isSuccess` (not just `!isLoading`) guards against a disabled, not-yet-fetched query on an
  // inactive tab — those report `isLoading: false` with no data, which would otherwise show this
  // tab as empty before it has ever actually fetched.
  const showEmptyState = isSuccess && !error && filteredItems.length === 0;

  return (
    <Stack hasGutter>
      <StackItem>
        <Flex
          spaceItems={{ default: 'spaceItemsSm' }}
          alignItems={{ default: 'alignItemsCenter' }}
          flexWrap={{ default: 'wrap' }}
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
        >
          <FlexItem>
            <Flex
              spaceItems={{ default: 'spaceItemsSm' }}
              alignItems={{ default: 'alignItemsCenter' }}
              flexWrap={{ default: 'wrap' }}
            >
              <FlexItem>
                <SearchInput
                  placeholder={t('Search catalog items')}
                  value={search}
                  onChange={(_event, value) => setSearch(value)}
                  onClear={() => setSearch('')}
                  aria-label={t('Filter catalog by keyword')}
                  isDisabled={isLoading || !!error}
                />
              </FlexItem>
              <FlexItem>
                <ToggleGroup aria-label={t('Filter by publication status')}>
                  {publicationFilters.map((option) => (
                    <ToggleGroupItem
                      key={option.value}
                      text={option.label}
                      buttonId={`publication-filter-${option.value}`}
                      isSelected={publicationFilter === option.value}
                      onChange={() => setPublicationFilter(option.value)}
                    />
                  ))}
                </ToggleGroup>
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Button variant="primary" onClick={() => navigate('/admin/catalog/cluster/create')}>
              {t('Create')}
            </Button>
          </FlexItem>
        </Flex>
      </StackItem>
      {showEmptyState ? (
        <StackItem>
          <EmptyState titleText={t('No catalog items found')} headingLevel="h2">
            <EmptyStateBody>
              {isFiltered
                ? t('No catalog items match your search or filter.')
                : t('No catalog items have been created yet.')}
            </EmptyStateBody>
          </EmptyState>
        </StackItem>
      ) : (
        <ListPageBody isLoading={isLoading} error={error}>
          <Stack hasGutter>
            <StackItem>
              <Title headingLevel="h2" size="lg">
                {t('Clusters')}
              </Title>
            </StackItem>
            <StackItem>
              <Gallery hasGutter>
                {filteredItems.map((item) => (
                  <GalleryItem key={item.id}>
                    <CatalogItemCard
                      item={item}
                      onOpenDetails={() => navigate(`/admin/catalog/cluster/${item.id}`)}
                      scopeBadge={<CatalogItemScopeBadge scope={catalogItemScope(item, role)} />}
                      statusLabel={<CatalogItemStatusLabel published={item.published} />}
                    />
                  </GalleryItem>
                ))}
              </Gallery>
            </StackItem>
          </Stack>
        </ListPageBody>
      )}
    </Stack>
  );
};

export default ClusterCatalogManagementPanel;
