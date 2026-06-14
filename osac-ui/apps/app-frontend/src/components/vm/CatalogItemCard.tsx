import {
  Card,
  CardBody,
  Content,
  Divider,
  Flex,
  FlexItem,
  Label,
  Radio,
} from '@patternfly/react-core';
import type { CatalogItemBase } from '@osac/api-contracts/types';
import {
  catalogItemMetadataLabelEntries,
  catalogItemResourceParts,
  catalogItemSubtitle,
} from './catalogItemDisplay';
import './TemplateCard.css';

export interface CatalogItemCardSelection {
  selected: boolean;
  radioName: string;
  onSelect: () => void;
}

interface CatalogItemCardProps {
  item: CatalogItemBase;
  id?: string;
  ouiaId?: string;
  selection?: CatalogItemCardSelection;
  onOpenDetails?: () => void;
}

export const CatalogItemCard = ({
  item,
  id,
  ouiaId,
  selection,
  onOpenDetails,
}: CatalogItemCardProps) => {
  const resources = catalogItemResourceParts(item);
  const metadataLabels = catalogItemMetadataLabelEntries(item);
  const subtitle = catalogItemSubtitle(item);
  const cardClassName = [
    'tenant-vm-template-card',
    selection ? 'tenant-vm-template-card--selectable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleCardClick = () => {
    if (onOpenDetails) {
      onOpenDetails();
      return;
    }
    selection?.onSelect();
  };

  return (
    <Card
      id={id}
      ouiaId={ouiaId}
      isClickable={Boolean(selection || onOpenDetails)}
      isSelected={selection?.selected}
      isFullHeight
      className={cardClassName}
      onClick={handleCardClick}
    >
      {selection ? (
        <div
          className="tenant-vm-template-card__select"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Radio
            id={`${selection.radioName}-${item.id}`}
            name={selection.radioName}
            aria-label={item.title}
            isChecked={selection.selected}
            onChange={selection.onSelect}
          />
        </div>
      ) : null}
      <div className="tenant-vm-template-card__title-band">
        <Content component="h3" className="tenant-vm-template-card__title">
          {item.title}
        </Content>
      </div>
      <CardBody className="tenant-vm-template-card__body">
        <div className="tenant-vm-template-card__intro">
          <Content component="small" className="tenant-vm-template-card__subtitle">
            {subtitle}
          </Content>
          {resources.length > 0 ? (
            <Flex
              className="tenant-vm-template-card__resource-row"
              flexWrap={{ default: 'wrap' }}
              gap={{ default: 'gapSm' }}
            >
              {resources.map((resource, index) => (
                <FlexItem key={`${item.id}-resource-${index}`}>
                  <Label variant="outline" color="blue" isCompact>
                    {resource}
                  </Label>
                </FlexItem>
              ))}
            </Flex>
          ) : null}
        </div>
        {metadataLabels.length > 0 ? (
          <>
            {resources.length > 0 ? (
              <Divider className="tenant-vm-template-card__section-divider" />
            ) : null}
            <Flex
              className="tenant-vm-template-card__metadata-labels"
              flexWrap={{ default: 'wrap' }}
              gap={{ default: 'gapSm' }}
            >
              {metadataLabels.map(({ key, value }) => (
                <FlexItem key={`${item.id}-label-${key}`}>
                  <Label variant="outline" color="grey" isCompact>
                    <span className="tenant-vm-template-card__metadata-label-key">{key}</span>
                    {': '}
                    {value}
                  </Label>
                </FlexItem>
              ))}
            </Flex>
          </>
        ) : null}
      </CardBody>
    </Card>
  );
};
