import { useNavigate } from 'react-router-dom';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  SearchInput,
  Stack,
  StackItem,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import type { UseQueryResult } from '@tanstack/react-query';

import type { CatalogItem } from '@osac/ui-components/components/catalog/catalogItemDisplay';
import {
  catalogItemScope,
  filterCatalogItemsBySearch,
} from '@osac/ui-components/components/catalog/catalogItemDisplay';
import { CatalogItemListSection } from '@osac/ui-components/components/catalog/CatalogItemListSection';
import CatalogItemPublishToggle from '@osac/ui-components/components/catalogManagement/CatalogItemPublishToggle';
import CatalogItemScopeBadge from '@osac/ui-components/components/catalogManagement/CatalogItemScopeBadge';
import CatalogItemStatusLabel from '@osac/ui-components/components/catalogManagement/CatalogItemStatusLabel';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import type { DemoShellRole } from '@osac/ui-components/shellTypes';

export type CatalogManagementTabKey = 'cluster' | 'compute-instance' | 'baremetal-instance';
export type PublicationFilter = 'all' | 'published' | 'unpublished';

const matchesPublicationFilter = (item: CatalogItem, filter: PublicationFilter): boolean => {
  if (filter === 'published') {
    return item.published;
  }
  if (filter === 'unpublished') {
    return !item.published;
  }
  return true;
};

interface CatalogManagementTabPanelProps {
  tabKey: CatalogManagementTabKey;
  title: string;
  result: UseQueryResult<CatalogItem[], unknown>;
  setPublished: (input: { id: string; published: boolean }) => void;
  search: string;
  setSearch: (value: string) => void;
  publicationFilter: PublicationFilter;
  setPublicationFilter: (value: PublicationFilter) => void;
  role: DemoShellRole;
}

const CatalogManagementTabPanel = ({
  tabKey,
  title,
  result,
  setPublished,
  search,
  setSearch,
  publicationFilter,
  setPublicationFilter,
  role,
}: CatalogManagementTabPanelProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data = [], isLoading, error } = result;

  const filteredItems = filterCatalogItemsBySearch(data, search).filter((item) =>
    matchesPublicationFilter(item, publicationFilter),
  );

  const publicationFilters: ReadonlyArray<{ value: PublicationFilter; label: string }> = [
    { value: 'all', label: t('All') },
    { value: 'published', label: t('Published') },
    { value: 'unpublished', label: t('Unpublished') },
  ];

  const isFiltered = search.trim().length > 0 || publicationFilter !== 'all';
  // `result.isSuccess` (not just `!isLoading`) guards against a disabled, not-yet-fetched query on
  // an inactive tab — those report `isLoading: false` with no data, which would otherwise show this
  // tab as empty before it has ever actually fetched.
  const showEmptyState = result.isSuccess && !error && filteredItems.length === 0;

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
            <Button variant="primary" onClick={() => navigate(`/admin/catalog/${tabKey}/create`)}>
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
        <CatalogItemListSection
          title={title}
          items={filteredItems}
          isLoading={isLoading}
          error={error}
          onSelectItem={(item) => navigate(`/admin/catalog/${tabKey}/${item.id}`)}
          renderCardAddons={(item) => {
            const scope = catalogItemScope(item, role);
            const isToggleDisabled = role === 'tenantAdmin' && scope.level === 'general';
            return {
              scopeBadge: <CatalogItemScopeBadge scope={scope} />,
              statusLabel: <CatalogItemStatusLabel published={item.published} />,
              publishToggle: (
                <CatalogItemPublishToggle
                  published={item.published}
                  isDisabled={isToggleDisabled}
                  onChange={(published) => setPublished({ id: item.id, published })}
                />
              ),
            };
          }}
        />
      )}
    </Stack>
  );
};

export default CatalogManagementTabPanel;
