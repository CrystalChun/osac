import { useMemo, useState } from 'react';
import {
  Alert,
  Bullseye,
  Button,
  Content,
  Flex,
  FlexItem,
  SearchInput,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import CatalogItemCard from '../../../catalog/CatalogItemCard';
import {
  type CatalogItemKind,
  filterCatalogItemsBySearch,
} from '../../../catalog/catalogItemDisplay';
import { readCatalogItemFieldDefinitions } from '../../catalogFieldDefinition';
import type { CatalogProvisionCatalogItem } from '../../catalogProvisionItem';
import type { CatalogProvisionAdapter } from '../adapters/types';
import { STEP_LABELS } from '../stepIds';
import type { CatalogProvisionWizardState, UpdateDraftFn } from '../types';
import {
  seedFieldValuesFromCatalogItem,
  seedNetworkAttachmentRowsFromCatalogItem,
} from '../wizardBuild';

const applySelectedCatalogItem = <TItem extends CatalogProvisionCatalogItem>(
  item: TItem,
  update: UpdateDraftFn,
) => {
  update('catalogItemId', item.id);
  update('fieldValues', seedFieldValuesFromCatalogItem(readCatalogItemFieldDefinitions(item)));
  update(
    'networkAttachmentRows',
    seedNetworkAttachmentRowsFromCatalogItem(readCatalogItemFieldDefinitions(item)),
  );
};

interface Props<TItem extends CatalogProvisionCatalogItem> {
  adapter: CatalogProvisionAdapter<TItem, unknown>;
  state: CatalogProvisionWizardState;
  update: UpdateDraftFn;
}

export const CatalogStep = <TItem extends CatalogProvisionCatalogItem>({
  adapter,
  state,
  update,
}: Props<TItem>) => {
  const [search, setSearch] = useState('');

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
  const countPhrase = `${count} ${count === 1 ? 'catalog item' : 'catalog items'} available`;

  return (
    <Stack hasGutter>
      <StackItem>
        <Flex
          direction={{ default: 'column', md: 'row' }}
          flexWrap={{ default: 'wrap' }}
          alignItems={{ default: 'alignItemsFlexEnd' }}
          gap={{ default: 'gapMd' }}
        >
          <FlexItem flex={{ default: 'flex_1' }} className="osac-wizard-template__search-item">
            <SearchInput
              placeholder="Search catalog items…"
              value={search}
              onChange={(_e, v) => setSearch(v)}
              onClear={() => setSearch('')}
              aria-label="Search catalog items"
            />
          </FlexItem>
        </Flex>
      </StackItem>
      <StackItem>
        <Flex
          gap={{ default: 'gapSm' }}
          flexWrap={{ default: 'wrap' }}
          alignItems={{ default: 'alignItemsBaseline' }}
        >
          <Content component="p" className="osac-wizard-template__count">
            {catalogLoading ? 'Loading catalog items…' : countPhrase}
          </Content>
          <Content
            component="p"
            className="pf-v6-u-color-text-subtle osac-wizard-template__count-hint"
          >
            Select one to continue.
          </Content>
        </Flex>
      </StackItem>
      {catalogError ? (
        <StackItem>
          <Stack hasGutter>
            <StackItem>
              <Alert variant="danger" title="Could not load catalog items">
                Unable to load catalog items right now. Please try again.
              </Alert>
            </StackItem>
            <StackItem>
              <Button variant="primary" onClick={() => void refetchCatalogItems()}>
                Retry
              </Button>
            </StackItem>
          </Stack>
        </StackItem>
      ) : null}
      <StackItem>
        <div className="osac-template-cards" role="radiogroup" aria-label={STEP_LABELS.catalog}>
          {catalogLoading ? (
            <Bullseye className="osac-template-cards__loading">
              <Spinner aria-label="Loading catalog items" />
            </Bullseye>
          ) : null}
          {!catalogLoading && !catalogError && count === 0 ? (
            <Content component="p" className="pf-v6-u-color-text-subtle osac-template-cards__empty">
              No catalog items match your search. Try changing keywords.
            </Content>
          ) : null}
          {!catalogLoading &&
            !catalogError &&
            filtered.map((item) => {
              const selected = state.catalogItemId === item.id;
              return (
                <div key={item.id} className="osac-wizard-catalog-card-wrap">
                  <CatalogItemCard
                    item={item}
                    kind={catalogItemKind}
                    id={`catalog-item-card-${item.id}`}
                    ouiaId={`catalog-item-option-${item.id}`}
                    selection={{
                      selected,
                      radioName: 'selectedCatalogItem',
                      onSelect: () => applySelectedCatalogItem(item, update),
                    }}
                  />
                </div>
              );
            })}
        </div>
      </StackItem>
    </Stack>
  );
};
