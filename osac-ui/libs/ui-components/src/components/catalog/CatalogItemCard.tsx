import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Divider,
  Flex,
  FlexItem,
  Label,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type { CatalogItemForDisplay, CatalogItemKind } from './catalogItemDisplay';
import {
  catalogItemMetadataLabelEntries,
  catalogItemResourceParts,
  catalogItemSubtitle,
  inferCatalogItemKind,
} from './catalogItemDisplay';
import { useTranslation } from '../../hooks/useTranslation';
import { CatalogItemIcon } from '../../icons';

export interface CatalogItemCardSelection {
  selected: boolean;
  radioName: string;
  onSelect: () => void;
}

interface CatalogItemCardProps {
  item: CatalogItemForDisplay;
  kind?: CatalogItemKind;
  id?: string;
  ouiaId?: string;
  selection?: CatalogItemCardSelection;
  onOpenDetails?: () => void;
  /** Highlights the card when its detail drawer is open (catalog page only). */
  isBrowseSelected?: boolean;
}

const CatalogItemCard = ({
  item,
  kind,
  id,
  ouiaId,
  selection,
  onOpenDetails,
  isBrowseSelected = false,
}: CatalogItemCardProps) => {
  const { t } = useTranslation();
  const resources = catalogItemResourceParts(item);
  const metadataLabels = catalogItemMetadataLabelEntries(item);
  const subtitle = catalogItemSubtitle(item);
  const isBrowseMode = Boolean(onOpenDetails && !selection);
  const isWizardMode = Boolean(selection);
  const cardId = id ?? `catalog-item-card-${item.id}`;
  const titleId = `${cardId}-title`;
  const catalogKind = kind ?? inferCatalogItemKind(item);

  return (
    <Card
      id={cardId}
      ouiaId={ouiaId}
      isSelectable={isWizardMode}
      isClickable={isBrowseMode}
      isSelected={selection?.selected}
      isClicked={isBrowseMode && isBrowseSelected}
      isFullHeight
    >
      <CardHeader
        selectableActions={
          isWizardMode && selection
            ? {
                variant: 'single',
                name: selection.radioName,
                selectableActionId: `${selection.radioName}-${item.id}`,
                selectableActionAriaLabel: item.title,
                hasNoOffset: true,
                onChange: () => {
                  selection.onSelect();
                },
              }
            : isBrowseMode
              ? {
                  selectableActionAriaLabel: t('Open catalog item details for {{title}}', {
                    title: item.title,
                  }),
                  onClickAction: () => {
                    onOpenDetails?.();
                  },
                }
              : undefined
        }
      >
        <Flex alignItems={{ default: 'alignItemsFlexStart' }} gap={{ default: 'gapSm' }}>
          <FlexItem>
            <CatalogItemIcon kind={catalogKind} />
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <CardTitle id={titleId}>{item.title}</CardTitle>
          </FlexItem>
        </Flex>
      </CardHeader>
      <Divider />
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Content component="small" className="pf-v6-u-color-text-subtle">
              {subtitle}
            </Content>
          </StackItem>
          {resources.length > 0 ? (
            <StackItem>
              <Flex flexWrap={{ default: 'wrap' }} gap={{ default: 'gapSm' }}>
                {resources.map((resource, index) => (
                  <FlexItem key={`${item.id}-resource-${index}`}>
                    <Label variant="outline" color="blue" isCompact>
                      {resource}
                    </Label>
                  </FlexItem>
                ))}
              </Flex>
            </StackItem>
          ) : null}
          {metadataLabels.length > 0 ? (
            <>
              {resources.length > 0 ? (
                <StackItem>
                  <Divider />
                </StackItem>
              ) : null}
              <StackItem>
                <Flex flexWrap={{ default: 'wrap' }} gap={{ default: 'gapSm' }}>
                  {metadataLabels.map(({ key, value }) => (
                    <FlexItem key={`${item.id}-label-${key}`}>
                      <Label variant="outline" color="grey" isCompact>
                        <b>{key}</b>
                        {': '}
                        {value}
                      </Label>
                    </FlexItem>
                  ))}
                </Flex>
              </StackItem>
            </>
          ) : null}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default CatalogItemCard;
