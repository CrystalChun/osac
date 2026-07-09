import { useMemo, useState } from 'react';
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

import { useClusterCatalogItems } from '@osac/ui-components/api/v1/cluster-catalog-item';
import { useComputeInstanceCatalogItems } from '@osac/ui-components/api/v1/compute-instance-catalog-item';
import { CatalogItemDetailDrawer } from '@osac/ui-components/components/catalog/CatalogItemDetailDrawer';
import type {
  CatalogItemForDisplay,
  CatalogItemKind,
} from '@osac/ui-components/components/catalog/catalogItemDisplay';
import { filterCatalogItemsBySearch } from '@osac/ui-components/components/catalog/catalogItemDisplay';
import { CatalogItemListSection } from '@osac/ui-components/components/catalog/CatalogItemListSection';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

type CatalogTypeFilter = 'vm' | 'cluster';

interface SelectedCatalogItem {
  kind: CatalogItemKind;
  item: CatalogItemForDisplay;
}

interface Props {
  isProviderGlobal?: boolean;
}

export const CatalogPage = ({ isProviderGlobal = false }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CatalogTypeFilter>('vm');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<SelectedCatalogItem | null>(null);

  const catalogTypeFilters = useMemo(
    () =>
      [
        { value: 'vm' as const, label: t('Virtual machines') },
        { value: 'cluster' as const, label: t('Clusters') },
      ] satisfies ReadonlyArray<{ value: CatalogTypeFilter; label: string }>,
    [t],
  );

  const {
    data: vmCatalogItems = [],
    isLoading: vmLoading,
    error: vmError,
  } = useComputeInstanceCatalogItems();
  const {
    data: clusterCatalogItems = [],
    isLoading: clusterLoading,
    error: clusterError,
  } = useClusterCatalogItems();

  const isVmFilter = typeFilter === 'vm';
  const filteredVmItems = useMemo(
    () => filterCatalogItemsBySearch(vmCatalogItems, search),
    [search, vmCatalogItems],
  );
  const filteredClusterItems = useMemo(
    () => filterCatalogItemsBySearch(clusterCatalogItems, search),
    [search, clusterCatalogItems],
  );
  const filteredItems: CatalogItemForDisplay[] = isVmFilter
    ? filteredVmItems
    : filteredClusterItems;

  const isLoading = isVmFilter ? vmLoading : clusterLoading;
  const activeError = isVmFilter ? vmError : clusterError;
  const searchTerm = search.trim();
  const showEmptyState = !isLoading && !activeError && filteredItems.length === 0;

  const pageDescription = isProviderGlobal
    ? t('Browse published catalog items for virtual machines and clusters.')
    : t('Browse catalog items and launch virtual machines or clusters from published offerings.');

  const handleTypeFilterChange = (value: CatalogTypeFilter) => {
    setTypeFilter(value);
    setSelectedCatalogItem(null);
  };

  const catalogCreateAction = useMemo(() => {
    if (!selectedCatalogItem) {
      return null;
    }
    if (selectedCatalogItem.kind === 'vm') {
      return {
        label: t('Create virtual machine'),
        path: `/vms/create/${selectedCatalogItem.item.id}`,
      };
    }
    if (selectedCatalogItem.kind === 'cluster') {
      return {
        label: t('Create cluster'),
        path: `/clusters/create/${selectedCatalogItem.item.id}`,
      };
    }
    return null;
  }, [selectedCatalogItem, t]);

  return (
    <ListPage
      title={isProviderGlobal ? t('Global catalog') : t('Catalog')}
      description={pageDescription}
    >
      <CatalogItemDetailDrawer
        item={selectedCatalogItem?.item ?? null}
        onClose={() => setSelectedCatalogItem(null)}
        actions={
          catalogCreateAction ? (
            <Button variant="primary" onClick={() => navigate(catalogCreateAction.path)}>
              {catalogCreateAction.label}
            </Button>
          ) : null
        }
      >
        <Stack hasGutter>
          <StackItem>
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
                  isDisabled={isLoading || !!activeError}
                />
              </FlexItem>
              <FlexItem>
                <ToggleGroup aria-label={t('Filter catalog by resource type')}>
                  {catalogTypeFilters.map((option) => (
                    <ToggleGroupItem
                      key={option.value}
                      text={option.label}
                      buttonId={`catalog-type-filter-${option.value}`}
                      isSelected={typeFilter === option.value}
                      onChange={() => handleTypeFilterChange(option.value)}
                    />
                  ))}
                </ToggleGroup>
              </FlexItem>
            </Flex>
          </StackItem>

          {showEmptyState ? (
            <StackItem>
              <EmptyState titleText={t('No catalog items found')} headingLevel="h2">
                <EmptyStateBody>
                  {searchTerm
                    ? t('No catalog items match your search.')
                    : t('No published catalog items are available yet.')}
                </EmptyStateBody>
              </EmptyState>
            </StackItem>
          ) : (
            <CatalogItemListSection
              title={isVmFilter ? t('Virtual machines') : t('Clusters')}
              kind={isVmFilter ? 'vm' : 'cluster'}
              items={filteredItems}
              isLoading={isLoading}
              error={activeError}
              selectedItemId={selectedCatalogItem?.item.id ?? null}
              onSelectItem={(item) =>
                setSelectedCatalogItem({ kind: isVmFilter ? 'vm' : 'cluster', item })
              }
            />
          )}
        </Stack>
      </CatalogItemDetailDrawer>
    </ListPage>
  );
};
