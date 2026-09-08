import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Divider,
  Flex,
  FlexItem,
  PageSection,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import { ExternalIPPools } from '@osac/types/private';

import ExternalIpPoolDeleteConfirmModal from './ExternalIpPoolDeleteConfirmModal';
import ExternalIpPoolDetailsPageContent from './ExternalIpPoolDetailsPageContent';
import { useGetResource } from '../../api/use-resource';
import { useTranslation } from '../../hooks/useTranslation';
import { ResourceDetailHeader } from '../Resource/ResourceDetailHeader';
import { ResourceDetailsPageError } from '../Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../Resource/ResourceDetailsPageLoading';

const POOLS_LIST_PATH = '/admin/infrastructure/external-ip-pools';

export const ExternalIpPoolDetailsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const [deleteOpen, setDeleteOpen] = useState(false);
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
      {deleteOpen && (
        <ExternalIpPoolDeleteConfirmModal
          pool={pool}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => navigate(POOLS_LIST_PATH)}
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
      <ExternalIpPoolDetailsPageContent pool={pool} />
    </>
  );
};
