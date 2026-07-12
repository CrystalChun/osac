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
import type { TFunction } from 'i18next';

import { useBareMetalInstanceCatalogItems } from '@osac/ui-components/api/v1/baremetal-instance';
import { useClusterCatalogItems } from '@osac/ui-components/api/v1/cluster-catalog-item';
import { useComputeInstanceCatalogItems } from '@osac/ui-components/api/v1/compute-instance-catalog-item';
import { CatalogItemDetailDrawer } from '@osac/ui-components/components/catalog/CatalogItemDetailDrawer';
import type {
  CatalogItem,
  CatalogItemKind,
} from '@osac/ui-components/components/catalog/catalogItemDisplay';
import { filterCatalogItemsBySearch } from '@osac/ui-components/components/catalog/catalogItemDisplay';
import { CatalogItemListSection } from '@osac/ui-components/components/catalog/CatalogItemListSection';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

type CatalogTypeFilter = 'vm' | 'cluster' | 'bm';

interface SelectedCatalogItem {
  kind: CatalogItemKind;
  item: CatalogItem;
}

interface Props {
  isProviderGlobal?: boolean;
}

const getTypeLabel = (typeFilter: CatalogTypeFilter, t: TFunction) => {
  switch (typeFilter) {
    case 'vm':
      return t('Virtual Machines');
    case 'bm':
      return t('Bare Metal Machines');
    default:
      return t('Clusters');
  }
};

const useCatalogItems = (typeFilter: CatalogTypeFilter) => {
  const vms = useComputeInstanceCatalogItems(undefined, typeFilter === 'vm');
  const clusters = useClusterCatalogItems(undefined, typeFilter === 'cluster');
  const bms = useBareMetalInstanceCatalogItems(typeFilter === 'bm');

  switch (typeFilter) {
    case 'vm':
      return vms;
    case 'bm':
      return bms;
    default:
      return clusters;
  }
};

export const CatalogPage = ({ isProviderGlobal = false }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CatalogTypeFilter>('vm');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<SelectedCatalogItem>();

  const catalogTypeFilters = useMemo<ReadonlyArray<{ value: CatalogTypeFilter; label: string }>>(
    () => [
      { value: 'vm', label: t('Virtual Machines') },
      { value: 'cluster', label: t('Clusters') },
      { value: 'bm', label: t('Bare Metal Machines') },
    ],
    [t],
  );

  const { data = [], isLoading, error } = useCatalogItems(typeFilter);

  const filteredItems = useMemo(() => filterCatalogItemsBySearch(data, search), [search, data]);

  const searchTerm = search.trim();
  const showEmptyState = !isLoading && !error && filteredItems.length === 0;

  const pageDescription = isProviderGlobal
    ? t('Browse published catalog items for virtual machines, clusters, and bare metal machines.')
    : t(
        'Browse catalog items and launch virtual machines, clusters, or bare metal machines from published offerings.',
      );

  const handleTypeFilterChange = (value: CatalogTypeFilter) => {
    setTypeFilter(value);
    setSelectedCatalogItem(undefined);
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
    if (selectedCatalogItem.kind === 'bm') {
      return {
        label: t('Provision bare metal'),
        path: `/bare-metal/create/${selectedCatalogItem.item.id}`,
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
        item={selectedCatalogItem?.item}
        onClose={() => setSelectedCatalogItem(undefined)}
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
                  isDisabled={isLoading || !!error}
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
              title={getTypeLabel(typeFilter, t)}
              items={filteredItems}
              isLoading={isLoading}
              error={error}
              selectedItemId={selectedCatalogItem?.item.id ?? null}
              onSelectItem={(item) => setSelectedCatalogItem({ kind: typeFilter, item })}
            />
          )}
        </Stack>
      </CatalogItemDetailDrawer>
    </ListPage>
  );
};
