import { useState } from 'react';
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  PageSection,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';

import type { ExternalIPPool } from '@osac/types/private';

import ExternalIpPoolCidrsSection from './ExternalIpPoolCidrsSection';
import ExternalIpPoolDeleteConfirmModal from './ExternalIpPoolDeleteConfirmModal';
import ExternalIpPoolStatusLabel from './ExternalIpPoolStatusLabel';
import { useTranslation } from '../../hooks/useTranslation';
import { displayValue } from '../../utils/detailFormatters';
import { Timestamp } from '../Primitives/Timestamp';
import { ResourceDetailHeader } from '../Resource/ResourceDetailHeader';

const POOLS_LIST_PATH = '/admin/infrastructure/external-ip-pools';
const SHARED_TENANT = 'shared';

interface ExternalIpPoolDetailsPageContentProps {
  pool: ExternalIPPool;
  onDeleted: () => void;
}

const ExternalIpPoolDetailsPageContent = ({
  pool,
  onDeleted,
}: ExternalIpPoolDetailsPageContentProps) => {
  const { t } = useTranslation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const cidrs = pool.spec?.cidrs ?? [];
  const tenant = pool.metadata?.tenant;

  return (
    <>
      {deleteOpen && (
        <ExternalIpPoolDeleteConfirmModal
          pool={pool}
          onClose={() => setDeleteOpen(false)}
          onSuccess={onDeleted}
        />
      )}
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
                  parentTo={POOLS_LIST_PATH}
                  parentLabel={t('External IP pools')}
                  resourceName={pool.metadata?.name || pool.id}
                  description={pool.metadata?.description}
                />
              </FlexItem>
              <FlexItem>
                <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                  {t('Delete')}
                </Button>
              </FlexItem>
            </Flex>
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
        </Stack>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Grid hasGutter>
          <GridItem md={4}>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h2" size="lg">
                  {t('Overview')}
                </Title>
              </StackItem>
              <StackItem>
                <DescriptionList isCompact aria-label={t('External IP pool overview')}>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <ExternalIpPoolStatusLabel state={pool.status?.state} />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Timestamp value={pool.metadata?.creationTimestamp} />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  {tenant ? (
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Tenant')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        {tenant === SHARED_TENANT ? t('Shared') : tenant}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  ) : null}
                </DescriptionList>
              </StackItem>
            </Stack>
          </GridItem>

          <GridItem md={4}>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h2" size="lg">
                  {t('Capacity')}
                </Title>
              </StackItem>
              <StackItem>
                <DescriptionList isCompact aria-label={t('External IP pool capacity')}>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Available')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {pool.status ? `${pool.status.available}` : displayValue()}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Total')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {pool.status ? `${pool.status.total}` : displayValue()}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </StackItem>
            </Stack>
          </GridItem>

          <GridItem md={4}>
            <ExternalIpPoolCidrsSection cidrs={cidrs} />
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};

export default ExternalIpPoolDetailsPageContent;
