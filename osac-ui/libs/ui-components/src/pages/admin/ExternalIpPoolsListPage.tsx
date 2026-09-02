import { useNavigate } from 'react-router-dom';
import { Button, Flex, FlexItem } from '@patternfly/react-core';

import { ExternalIPPools } from '@osac/types/private';
import { useListResource } from '@osac/ui-components/api/use-resource';
import { ExternalIpPoolsTable } from '@osac/ui-components/components/networking/ExternalIpPoolsTable';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { SubtleContent } from '@osac/ui-components/components/SubtleContent/SubtleContent';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

export const ExternalIpPoolsListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading, error } = useListResource(ExternalIPPools);
  const pools = data?.items ?? [];

  return (
    <>
      <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
        <FlexItem>
          <Button
            variant="primary"
            onClick={() => navigate('/admin/infrastructure/external-ip-pools/create')}
          >
            {t('Create pool')}
          </Button>
        </FlexItem>
      </Flex>
      <ListPageBody isLoading={isLoading} error={error}>
        {pools.length === 0 ? (
          <SubtleContent component="p">
            {t('No external IP pools yet. Create one to get started.')}
          </SubtleContent>
        ) : (
          <ExternalIpPoolsTable pools={pools} />
        )}
      </ListPageBody>
    </>
  );
};
