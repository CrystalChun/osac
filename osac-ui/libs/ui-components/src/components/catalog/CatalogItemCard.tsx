import { useNavigate } from 'react-router-dom';
import {
  Button,
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
import RocketIcon from '@patternfly/react-icons/dist/esm/icons/rocket-icon';

import { CatalogItem, CatalogItemKind, getCatalogCreateAction } from './catalogItemDisplay';
import { catalogItemTypeBadgeLabel } from './catalogItemDisplay';
import {
  catalogItemMetadataLabelEntries,
  catalogItemResourceParts,
  catalogItemSubtitle,
} from './catalogItemDisplay';
import { useTranslation } from '../../hooks/useTranslation';
import { CatalogItemIcon } from '../../icons';

export interface CatalogItemCardSelection {
  selected: boolean;
  radioName: string;
  onSelect: () => void;
}

interface CatalogItemCardProps {
  item: CatalogItem;
  type?: CatalogItemKind;
  ouiaId?: string;
  selection?: CatalogItemCardSelection;
  onOpenDetails?: () => void;
  isSelected?: boolean;
}

const CatalogItemCard = ({
  item,
  type,
  ouiaId,
  selection,
  onOpenDetails,
  isSelected,
}: CatalogItemCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const resources = catalogItemResourceParts(item);
  const metadataLabels = catalogItemMetadataLabelEntries(item);
  const subtitle = catalogItemSubtitle(item);
  const isBrowseMode = Boolean(onOpenDetails && !selection);
  const isWizardMode = Boolean(selection);
  const cardId = `catalog-item-card-${item.id}`;
  const titleId = `${cardId}-title`;

  const handleLaunch = () => {
    if (type) {
      const createAction = getCatalogCreateAction(type, item.id, t);
      navigate(createAction.path);
    }
  };

  return (
    <Card
      id={cardId}
      ouiaId={ouiaId}
      isSelectable={isWizardMode}
      isClickable={isBrowseMode}
      isSelected={selection?.selected}
      isClicked={isBrowseMode && isSelected}
      isFullHeight
    >
      <CardHeader
        actions={{
          actions: type ? (
            <Label color="blue" isCompact>
              {catalogItemTypeBadgeLabel(type, t)}
            </Label>
          ) : null,
        }}
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
            <CatalogItemIcon kind={item.$typeName} />
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
          <StackItem>
            <Divider />
          </StackItem>
          {metadataLabels.length > 0 ? (
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
          ) : null}
          {type ? (
            <StackItem>
              <Button
                variant="primary"
                isBlock
                icon={<RocketIcon />}
                onClick={(event) => {
                  event.stopPropagation();
                  handleLaunch();
                }}
              >
                {t('Launch instance')}
              </Button>
            </StackItem>
          ) : null}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default CatalogItemCard;
