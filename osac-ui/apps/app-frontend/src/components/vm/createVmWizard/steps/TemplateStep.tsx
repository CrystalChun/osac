import {
  Alert,
  Bullseye,
  Button,
  Card,
  CardBody,
  CardHeader,
  Content,
  Flex,
  FlexItem,
  Radio,
  SearchInput,
  Spinner,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { useMemo, useState } from 'react';
import type { ClusterTemplate, ComputeInstanceCatalogItem } from '@osac/api-contracts/types';
import { useComputeInstanceCatalogItems, useComputeInstanceTemplates } from '../../../../api/hooks';
import { defaultTemplateBootDiskGib } from '../constants';
import { type UpdateFn, type WizardState, resolveUnderlyingTemplate } from '../types';

const applySelectedCatalogItem = (
  item: ComputeInstanceCatalogItem,
  underlyingTemplate: ClusterTemplate | null,
  update: UpdateFn,
) => {
  update('selectedCatalogItemId', item.id);
  update('templateBootDiskSizeGib', String(defaultTemplateBootDiskGib(underlyingTemplate)));
};

const truncateDescription = (text: string, max = 120): string => {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
};

export const TemplateStep = ({ state, update }: { state: WizardState; update: UpdateFn }) => {
  const [search, setSearch] = useState('');

  const {
    data: catalogItems = [],
    isPending: catalogLoading,
    isError: catalogError,
    refetch: refetchCatalogItems,
  } = useComputeInstanceCatalogItems();
  const { data: templates = [] } = useComputeInstanceTemplates();

  const filtered = useMemo(() => {
    let list = [...catalogItems];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.description ?? '').toLowerCase().includes(q) ||
          item.metadata.name.toLowerCase().includes(q),
      );
    }
    return list;
  }, [catalogItems, search]);

  const count = filtered.length;
  const countPhrase = `${count} ${count === 1 ? 'catalog item' : 'catalog items'} available`;

  return (
    <Stack hasGutter>
      <StackItem>
        <Title id="template-step-heading" headingLevel="h2" size="xl">
          Catalog
        </Title>
        <Content component="p" className="pf-v6-u-color-text-subtle osac-wizard-step__intro">
          Select a catalog item to create your virtual machine from
        </Content>
      </StackItem>
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
        <div
          className="osac-template-cards"
          role="radiogroup"
          aria-labelledby="template-step-heading"
        >
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
              const selected = state.selectedCatalogItemId === item.id;
              const underlyingTemplate = resolveUnderlyingTemplate(item, templates);
              const cores = underlyingTemplate?.defaultCores ?? 2;
              const mem = underlyingTemplate?.defaultMemoryGib ?? 8;
              const diskGib = defaultTemplateBootDiskGib(underlyingTemplate);
              return (
                <div key={item.id}>
                  <Card
                    id={`catalog-item-card-${item.id}`}
                    className="osac-template-cards__card"
                    isCompact
                    isClickable
                    isSelected={selected}
                    onClick={() => applySelectedCatalogItem(item, underlyingTemplate, update)}
                    ouiaId={`catalog-item-option-${item.id}`}
                  >
                    <CardHeader className="osac-template-cards__card-header">
                      <Flex
                        justifyContent={{ default: 'justifyContentSpaceBetween' }}
                        alignItems={{ default: 'alignItemsFlexStart' }}
                        className="osac-template-cards__card-header-row"
                      >
                        <FlexItem>
                          <Content component="h3" className="osac-template-cards__title">
                            {item.title}
                          </Content>
                        </FlexItem>
                        <FlexItem>
                          <Radio
                            id={`catalog-item-radio-${item.id}`}
                            name="selectedCatalogItem"
                            aria-label={item.title}
                            isChecked={selected}
                            onChange={() =>
                              applySelectedCatalogItem(item, underlyingTemplate, update)
                            }
                          />
                        </FlexItem>
                      </Flex>
                    </CardHeader>
                    <CardBody>
                      <Stack hasGutter>
                        {item.description ? (
                          <StackItem>
                            <Content
                              component="p"
                              className="pf-v6-u-color-text-subtle osac-template-cards__description"
                            >
                              {truncateDescription(item.description)}
                            </Content>
                          </StackItem>
                        ) : null}
                        <StackItem>
                          <Content component="p" className="osac-template-cards__specs">
                            {cores} vCPU · {mem} GiB memory · {diskGib} GiB disk
                          </Content>
                        </StackItem>
                      </Stack>
                    </CardBody>
                  </Card>
                </div>
              );
            })}
        </div>
      </StackItem>
    </Stack>
  );
};
