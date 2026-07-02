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
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

type CatalogTypeFilter = 'all' | 'vm' | 'cluster';

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
  const [typeFilter, setTypeFilter] = useState<CatalogTypeFilter>('all');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<SelectedCatalogItem | null>(null);

  const catalogTypeFilters = useMemo(
    () =>
      [
        { value: 'all' as const, label: t('All') },
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

  const showVmCatalog = typeFilter === 'all' || typeFilter === 'vm';
  const showClusterCatalog = typeFilter === 'all' || typeFilter === 'cluster';
  const usePageLevelQueryState = typeFilter !== 'all';

  const filteredVmItems = useMemo(
    () => (showVmCatalog ? filterCatalogItemsBySearch(vmCatalogItems, search) : []),
    [showVmCatalog, search, vmCatalogItems],
  );
  const filteredClusterItems = useMemo(
    () => (showClusterCatalog ? filterCatalogItemsBySearch(clusterCatalogItems, search) : []),
    [showClusterCatalog, search, clusterCatalogItems],
  );

  const isLoading =
    usePageLevelQueryState &&
    ((showVmCatalog && vmLoading) || (showClusterCatalog && clusterLoading));
  const error =
    usePageLevelQueryState && ((showVmCatalog && vmError) || (showClusterCatalog && clusterError))
      ? (vmError ?? clusterError)
      : null;

  const hasCatalogItems = filteredVmItems.length > 0 || filteredClusterItems.length > 0;
  const searchTerm = search.trim();
  const hasVisibleSections =
    (showVmCatalog && (vmLoading || vmError || filteredVmItems.length > 0)) ||
    (showClusterCatalog && (clusterLoading || clusterError || filteredClusterItems.length > 0));
  const showEmptyState = usePageLevelQueryState
    ? !hasCatalogItems
    : !hasVisibleSections && !vmLoading && !clusterLoading;

  const pageDescription = isProviderGlobal
    ? t('Browse published catalog items for virtual machines and clusters.')
    : t('Browse catalog items and launch virtual machines or clusters from published offerings.');

  return (
    <ListPage
      title={isProviderGlobal ? t('Global catalog') : t('Catalog')}
      description={pageDescription}
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <CatalogItemDetailDrawer
          item={selectedCatalogItem?.item ?? null}
          onClose={() => setSelectedCatalogItem(null)}
          actions={
            selectedCatalogItem?.kind === 'vm' ? (
              <Button
                variant="primary"
                onClick={() => navigate(`/vms/create/${selectedCatalogItem.item.id}`)}
              >
                {t('Create virtual machine')}
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
                        onChange={() => setTypeFilter(option.value)}
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
              <>
                <CatalogItemListSection
                  title={t('Virtual machines')}
                  kind="vm"
                  items={filteredVmItems}
                  isLoading={showVmCatalog && vmLoading}
                  error={showVmCatalog ? vmError : null}
                  selectedItemId={
                    selectedCatalogItem?.kind === 'vm' ? selectedCatalogItem.item.id : null
                  }
                  onSelectItem={(item) => setSelectedCatalogItem({ kind: 'vm', item })}
                />
                <CatalogItemListSection
                  title={t('Clusters')}
                  kind="cluster"
                  items={filteredClusterItems}
                  isLoading={showClusterCatalog && clusterLoading}
                  error={showClusterCatalog ? clusterError : null}
                  selectedItemId={
                    selectedCatalogItem?.kind === 'cluster' ? selectedCatalogItem.item.id : null
                  }
                  onSelectItem={(item) => setSelectedCatalogItem({ kind: 'cluster', item })}
                />
              </>
            )}
          </Stack>
        </CatalogItemDetailDrawer>
      </ListPageBody>
    </ListPage>
  );
};
