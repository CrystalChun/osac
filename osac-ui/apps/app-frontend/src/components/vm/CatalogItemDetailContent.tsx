import {
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Label,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import type { ComputeInstanceCatalogItem } from '@osac/api-contracts/types';
import {
  catalogItemMetadataLabelEntries,
  catalogItemResourceParts,
  formatCatalogFieldDefault,
} from './catalogItemDisplay';

interface CatalogItemDetailContentProps {
  item: ComputeInstanceCatalogItem;
}

export const CatalogItemDetailContent = ({ item }: CatalogItemDetailContentProps) => {
  const resources = catalogItemResourceParts(item);
  const metadataLabels = catalogItemMetadataLabelEntries(item);
  const fieldDefinitions = item.fieldDefinitions ?? [];

  return (
    <Stack className="catalog-item-detail-content">
      <StackItem>
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Catalog name</DescriptionListTerm>
            <DescriptionListDescription>{item.metadata.name}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Status</DescriptionListTerm>
            <DescriptionListDescription>
              {item.published ? 'Published' : 'Unpublished'}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>

      {item.description?.trim() ? (
        <StackItem>
          <Title headingLevel="h3" size="md" className="catalog-item-detail-content__section-title">
            Description
          </Title>
          <Content component="p">{item.description}</Content>
        </StackItem>
      ) : null}

      {resources.length > 0 ? (
        <StackItem>
          <Title headingLevel="h3" size="md" className="catalog-item-detail-content__section-title">
            Default resources
          </Title>
          <Flex flexWrap={{ default: 'wrap' }} gap={{ default: 'gapSm' }}>
            {resources.map((resource, index) => (
              <FlexItem key={`${item.id}-detail-resource-${index}`}>
                <Label variant="outline" color="blue" isCompact>
                  {resource}
                </Label>
              </FlexItem>
            ))}
          </Flex>
        </StackItem>
      ) : null}

      {metadataLabels.length > 0 ? (
        <StackItem>
          <Title headingLevel="h3" size="md" className="catalog-item-detail-content__section-title">
            Labels
          </Title>
          <Flex flexWrap={{ default: 'wrap' }} gap={{ default: 'gapSm' }}>
            {metadataLabels.map(({ key, value }) => (
              <FlexItem key={`${item.id}-detail-label-${key}`}>
                <Label variant="outline" color="grey" isCompact>
                  <span className="catalog-item-detail-content__label-key">{key}</span>
                  {': '}
                  {value}
                </Label>
              </FlexItem>
            ))}
          </Flex>
        </StackItem>
      ) : null}

      {fieldDefinitions.length > 0 ? (
        <StackItem>
          <Title headingLevel="h3" size="md" className="catalog-item-detail-content__section-title">
            Configuration defaults
          </Title>
          <DescriptionList isCompact>
            {fieldDefinitions.map((def) => (
              <DescriptionListGroup key={def.path}>
                <DescriptionListTerm>{def.displayName}</DescriptionListTerm>
                <DescriptionListDescription>
                  {formatCatalogFieldDefault(def)}
                  {!def.editable ? ' (not editable)' : null}
                </DescriptionListDescription>
              </DescriptionListGroup>
            ))}
          </DescriptionList>
        </StackItem>
      ) : null}
    </Stack>
  );
};
