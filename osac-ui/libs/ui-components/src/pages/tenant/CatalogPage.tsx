import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  Label,
  SearchInput,
  Stack,
  StackItem,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';

import { useBareMetalInstanceCatalogItems } from '@osac/ui-components/api/v1/baremetal-instance';
import { useClusterCatalogItems } from '@osac/ui-components/api/v1/cluster-catalog-item';
import { useComputeInstanceCatalogItems } from '@osac/ui-components/api/v1/compute-instance-catalog-item';
import {
  CatalogItem,
  CatalogItemKind,
  CatalogItemWithType,
  filterCatalogItemsBySearch,
  filterCatalogItemsByTypes,
} from '@osac/ui-components/components/catalog/catalogItemDisplay';
import { CatalogItemListSection } from '@osac/ui-components/components/catalog/CatalogItemListSection';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

type CatalogTypeFilter = CatalogItemKind;

const TYPE_FILTER_PARAM = 'types';
const SEARCH_PARAM = 'search';
const CATALOG_TYPE_FILTER_VALUES: readonly CatalogTypeFilter[] = ['vm', 'cluster', 'bm'];

const isCatalogTypeFilter = (value: string): value is CatalogTypeFilter =>
  value === 'vm' || value === 'cluster' || value === 'bm';

const parseTypeFilters = (searchParams: URLSearchParams): CatalogTypeFilter[] => {
  const raw = searchParams.get(TYPE_FILTER_PARAM);
  if (!raw) {
    return [];
  }
  const seen = new Set<CatalogTypeFilter>();
  const filters: CatalogTypeFilter[] = [];
  for (const value of raw.split(',')) {
    const trimmed = value.trim();
    if (isCatalogTypeFilter(trimmed) && !seen.has(trimmed)) {
      seen.add(trimmed);
      filters.push(trimmed);
    }
  }
  return filters;
};

const serializeTypeFilters = (filters: CatalogTypeFilter[]): string | null =>
  filters.length > 0 ? filters.join(',') : null;

const parseSearch = (searchParams: URLSearchParams): string => searchParams.get(SEARCH_PARAM) ?? '';

const typesWithItems = (items: CatalogItemWithType[]): CatalogTypeFilter[] =>
  CATALOG_TYPE_FILTER_VALUES.filter((type) => items.some((item) => item.type === type));

const mapToItemWithType = (
  items: CatalogItem[] | undefined,
  itemType: CatalogTypeFilter,
): CatalogItemWithType[] => {
  if (!items || !items.length) {
    return [];
  }
  return items.map((item: CatalogItem) => ({ ...item, type: itemType }));
};

const useCatalogItems = () => {
  const vms = useComputeInstanceCatalogItems(undefined);
  const clusters = useClusterCatalogItems(undefined);
  const bms = useBareMetalInstanceCatalogItems();

  const isLoading = vms.isLoading || clusters.isLoading || bms.isLoading;
  const error = vms.error || clusters.error || bms.error;

  const data: CatalogItemWithType[] = useMemo(() => {
    if (error || isLoading) {
      return [];
    }
    return [
      ...mapToItemWithType(vms.data, 'vm'),
      ...mapToItemWithType(clusters.data, 'cluster'),
      ...mapToItemWithType(bms.data, 'bm'),
    ];
  }, [isLoading, error, vms.data, clusters.data, bms.data]);

  return { error, isLoading, data };
};

const CatalogPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasInitializedTypeFilters = useRef(false);

  const typeFilters = useMemo(() => parseTypeFilters(searchParams), [searchParams]);
  const search = useMemo(() => parseSearch(searchParams), [searchParams]);
  const { data = [], isLoading, error } = useCatalogItems();

  useEffect(() => {
    if (hasInitializedTypeFilters.current || isLoading || error) {
      return;
    }
    hasInitializedTypeFilters.current = true;

    if (searchParams.has(TYPE_FILTER_PARAM)) {
      return;
    }

    const serialized = serializeTypeFilters(typesWithItems(data));
    if (!serialized) {
      return;
    }

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(TYPE_FILTER_PARAM, serialized);
        return next;
      },
      { replace: true },
    );
  }, [data, error, isLoading, searchParams, setSearchParams]);

  const toggleTypeFilter = (value: CatalogTypeFilter) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const current = parseTypeFilters(next);
        const updated = current.includes(value)
          ? current.filter((option) => option !== value)
          : [...current, value];
        const serialized = serializeTypeFilters(updated);
        if (serialized) {
          next.set(TYPE_FILTER_PARAM, serialized);
        } else {
          next.set(TYPE_FILTER_PARAM, '');
        }
        return next;
      },
      { replace: true },
    );
  };

  const setSearch = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const trimmed = value.trim();
        if (!trimmed) {
          next.delete(SEARCH_PARAM);
        } else {
          next.set(SEARCH_PARAM, value);
        }
        return next;
      },
      { replace: true },
    );
  };

  const catalogTypeFilters = useMemo<ReadonlyArray<{ value: CatalogTypeFilter; label: string }>>(
    () => [
      { value: 'vm', label: t('Virtual Machines') },
      { value: 'cluster', label: t('Clusters') },
      { value: 'bm', label: t('Bare Metal Machines') },
    ],
    [t],
  );

  const typeCounts = useMemo(
    () => ({
      vm: data.filter((d) => d.type === 'vm').length,
      cluster: data.filter((d) => d.type === 'cluster').length,
      bm: data.filter((d) => d.type === 'bm').length,
    }),
    [data],
  );

  const filteredItems = useMemo(
    () =>
      filterCatalogItemsBySearch(
        filterCatalogItemsByTypes(data, typeFilters),
        search,
      ) as CatalogItemWithType[],
    [search, data, typeFilters],
  );

  const showEmptyState = !isLoading && !error && filteredItems.length === 0;

  const pageDescription = t(
    'Browse catalog items and launch virtual machines, clusters, or bare metal machines from published offerings.',
  );

  return (
    <ListPage title={t('Catalog')} description={pageDescription}>
      <Stack hasGutter>
        <StackItem>
          <Flex
            spaceItems={{ default: 'spaceItemsSm' }}
            alignItems={{ default: 'alignItemsCenter' }}
            flexWrap={{ default: 'wrap' }}
          >
            <FlexItem>
              <ToggleGroup aria-label={t('Filter catalog by resource type')}>
                {catalogTypeFilters.map((option) => (
                  <ToggleGroupItem
                    key={option.value}
                    text={
                      <Flex
                        spaceItems={{ default: 'spaceItemsSm' }}
                        flexWrap={{ default: 'nowrap' }}
                      >
                        <FlexItem>{option.label}</FlexItem>
                        <FlexItem>
                          <Label isCompact>{typeCounts[option.value]}</Label>
                        </FlexItem>
                      </Flex>
                    }
                    buttonId={`catalog-type-filter-${option.value}`}
                    isSelected={typeFilters.includes(option.value)}
                    onChange={() => toggleTypeFilter(option.value)}
                  />
                ))}
              </ToggleGroup>
            </FlexItem>
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
          </Flex>
        </StackItem>

        {showEmptyState ? (
          <StackItem>
            {typeFilters.length === 0 && data.length > 0 ? (
              <EmptyState titleText={t('Select a service to view catalog items')} headingLevel="h2">
                <EmptyStateBody>
                  {t('Choose one or more services above to filter the catalog.')}
                </EmptyStateBody>
              </EmptyState>
            ) : (
              <EmptyState titleText={t('No catalog items found')} headingLevel="h2">
                <EmptyStateBody>
                  {data?.length
                    ? t('No catalog items match your filters.')
                    : t('No published catalog items are available yet.')}
                </EmptyStateBody>
              </EmptyState>
            )}
          </StackItem>
        ) : (
          <CatalogItemListSection
            items={filteredItems}
            isLoading={isLoading}
            error={error}
            onSelectItem={(item) => navigate(`/catalog/${item.type}/${item.id}`)}
          />
        )}
      </Stack>
    </ListPage>
  );
};

export default CatalogPage;
