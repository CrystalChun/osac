import { useMemo, useState } from 'react';
import {
  Alert,
  Bullseye,
  Button,
  Content,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  SearchInput,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { BuildComputeInstanceCreateBodyInput } from '../../../../api/v1/compute-instance-wire';
import { useTranslation } from '../../../../hooks/useTranslation';
import CatalogItemCard from '../../../catalog/CatalogItemCard';
import {
  type CatalogItemKind,
  filterCatalogItemsBySearch,
} from '../../../catalog/catalogItemDisplay';
import type { ComputeInstanceWizardValues } from '../adapters/computeInstance/fields';
import type { CatalogProvisionAdapter } from '../adapters/types';
import { CatalogFieldHelper } from '../CatalogFieldHelper';

interface Props {
  adapter: CatalogProvisionAdapter<
    ComputeInstanceCatalogItem,
    ComputeInstanceWizardValues,
    BuildComputeInstanceCreateBodyInput
  >;
}

export const CatalogStep = ({ adapter }: Props) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const formik = useFormikContext<ComputeInstanceWizardValues>();
  const { values, errors, touched } = formik;

  const {
    data: catalogItems = [],
    isPending: catalogLoading,
    isError: catalogError,
    refetch: refetchCatalogItems,
  } = adapter.useCatalogItems();

  const catalogItemKind: CatalogItemKind = adapter.kind === 'cluster' ? 'cluster' : 'vm';

  const filtered = useMemo(
    () => filterCatalogItemsBySearch(catalogItems, search),
    [catalogItems, search],
  );

  const count = filtered.length;
  const countPhrase = t('catalogProvision.catalog.count', { count });
  const catalogItemError =
    touched.catalogItemId && errors.catalogItemId ? String(errors.catalogItemId) : undefined;

  const handleSelect = async (item: ComputeInstanceCatalogItem) => {
    await adapter.onCatalogItemSelected?.(item, formik);
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <Flex
          direction={{ default: 'column', md: 'row' }}
          flexWrap={{ default: 'wrap' }}
          alignItems={{ default: 'alignItemsFlexEnd' }}
          gap={{ default: 'gapMd' }}
        >
          <FlexItem flex={{ default: 'flex_1' }}>
            <SearchInput
              placeholder={t('catalogProvision.catalog.searchPlaceholder')}
              value={search}
              onChange={(_event, value) => setSearch(value)}
              onClear={() => setSearch('')}
              aria-label={t('catalogProvision.catalog.searchAria')}
            />
          </FlexItem>
        </Flex>
      </StackItem>
      <StackItem>
        <Content component="p">{catalogLoading ? t('catalogProvision.catalog.loading') : countPhrase}</Content>
      </StackItem>
      {catalogItemError ? (
        <StackItem>
          <CatalogFieldHelper error={catalogItemError} fieldId="catalog-item-selection" />
        </StackItem>
      ) : null}
      {catalogError ? (
        <StackItem>
          <Stack hasGutter>
            <StackItem>
              <Alert variant="danger" title={t('catalogProvision.catalog.loadError')}>
                {t('catalogProvision.catalog.loadErrorDetail')}
              </Alert>
            </StackItem>
            <StackItem>
              <Button variant="primary" onClick={() => void refetchCatalogItems()}>
                {t('catalogProvision.actions.retry')}
              </Button>
            </StackItem>
          </Stack>
        </StackItem>
      ) : null}
      <StackItem>
        <Gallery
          hasGutter
          minWidths={{ default: '200px' }}
          role="radiogroup"
          aria-label={t('catalogProvision.steps.catalog.title')}
        >
          {catalogLoading ? (
            <GalleryItem>
              <Bullseye>
                <Spinner aria-label={t('catalogProvision.catalog.loading')} />
              </Bullseye>
            </GalleryItem>
          ) : null}
          {!catalogLoading && !catalogError && count === 0 ? (
            <GalleryItem>
              <Content component="p">{t('catalogProvision.catalog.empty')}</Content>
            </GalleryItem>
          ) : null}
          {!catalogLoading &&
            !catalogError &&
            filtered.map((item) => {
              const selected = values.catalogItemId === item.id;
              return (
                <GalleryItem key={item.id}>
                  <CatalogItemCard
                    item={item}
                    kind={catalogItemKind}
                    id={`catalog-item-card-${item.id}`}
                    ouiaId={`catalog-item-option-${item.id}`}
                    selection={{
                      selected,
                      radioName: 'selectedCatalogItem',
                      onSelect: () => {
                        void handleSelect(item);
                      },
                    }}
                  />
                </GalleryItem>
              );
            })}
        </Gallery>
      </StackItem>
    </Stack>
  );
};
