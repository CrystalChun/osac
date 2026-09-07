import { useNavigate, useParams } from 'react-router-dom';
import { Divider, Flex, FlexItem, PageSection, Stack, StackItem } from '@patternfly/react-core';

import { ExternalIPPools } from '@osac/types/private';

import ExternalIpPoolDetailsPageContent from './ExternalIpPoolDetailsPageContent';
import { useGetResource } from '../../api/use-resource';
import ExternalIpPoolActionsMenu from '../../components/networking/ExternalIpPoolActionsMenu';
import { ResourceDetailHeader } from '../../components/Resource/ResourceDetailHeader';
import { ResourceDetailsPageError } from '../../components/Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../../components/Resource/ResourceDetailsPageLoading';
import { useTranslation } from '../../hooks/useTranslation';

const POOLS_LIST_PATH = '/admin/infrastructure/external-ip-pools';

export const ExternalIpPoolDetailsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useGetResource(ExternalIPPools, { id });
  const pool = data?.object;

  if (isLoading) {
    return (
      <ResourceDetailsPageLoading
        parentTo={POOLS_LIST_PATH}
        parentLabel={t('External IP pools')}
        cardCount={3}
      />
    );
  }

  if (error) {
    return (
      <ResourceDetailsPageError
        parentTo={POOLS_LIST_PATH}
        parentLabel={t('External IP pools')}
        resourceLabel={t('external IP pool')}
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!pool) {
    return (
      <ResourceDetailsPageError
        parentTo={POOLS_LIST_PATH}
        parentLabel={t('External IP pools')}
        resourceLabel={t('external IP pool')}
        variant="not-found"
      />
    );
  }

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
                  parentTo={POOLS_LIST_PATH}
                  parentLabel={t('External IP pools')}
                  resourceName={pool.metadata?.name || pool.id}
                  description={t('Routable address pool for tenant edge exposure.')}
                />
              </FlexItem>
              <FlexItem>
                <ExternalIpPoolActionsMenu
                  pool={pool}
                  variant="actions"
                  onDeleted={() => navigate(POOLS_LIST_PATH)}
                />
              </FlexItem>
            </Flex>
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
        </Stack>
      </PageSection>
      <ExternalIpPoolDetailsPageContent pool={pool} />
    </>
  );
};
