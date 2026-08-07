import { useNavigate } from 'react-router-dom';
import { Button, Flex, FlexItem, PageSection, Stack, StackItem } from '@patternfly/react-core';
import type { TFunction } from 'i18next';

import { useTranslation } from '../../../hooks/useTranslation';
import { ResourceDetailHeader } from '../../Resource/ResourceDetailHeader';
import type { CatalogItem, CatalogItemKind } from '../catalogItemDisplay';
import { CatalogItemDetailContent } from './CatalogItemDetailContent.tsx';

interface CatalogItemDetailsProps {
  kind: CatalogItemKind;
  item: CatalogItem;
}

const getCatalogCreateAction = (kind: CatalogItemKind, id: string, t: TFunction) => {
  switch (kind) {
    case 'vm':
      return {
        label: t('Create virtual machine'),
        path: `/vms/create/${id}`,
      };
    case 'cluster':
      return {
        label: t('Create cluster'),
        path: `/clusters/create/${id}`,
      };
    case 'bm':
      return {
        label: t('Provision bare metal'),
        path: `/bare-metal/create/${id}`,
      };
  }
};

const CatalogItemDetails = ({ kind, item }: CatalogItemDetailsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createAction = getCatalogCreateAction(kind, item.id, t);

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <StackItem>
            <Flex
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
              alignItems={{ default: 'alignItemsFlexStart' }}
              flexWrap={{ default: 'wrap' }}
              spaceItems={{ default: 'spaceItemsMd' }}
            >
              <FlexItem>
                <ResourceDetailHeader
                  parentTo="/catalog"
                  parentLabel={t('Catalog')}
                  resourceName={item.title}
                />
              </FlexItem>
              <FlexItem>
                <Button variant="primary" onClick={() => navigate(createAction.path)}>
                  {createAction.label}
                </Button>
              </FlexItem>
            </Flex>
          </StackItem>
        </Stack>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <CatalogItemDetailContent item={item} />
      </PageSection>
    </>
  );
};

export default CatalogItemDetails;