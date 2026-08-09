import { useNavigate } from 'react-router-dom';
import { Button, Flex, FlexItem } from '@patternfly/react-core';

import { usePrivateStorageBackends } from '@osac/ui-components/api/v1/private/storage-backends';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { StorageBackendsTable } from '@osac/ui-components/components/Storage/StorageBackendsTable';
import { SubtleContent } from '@osac/ui-components/components/SubtleContent/SubtleContent';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

export const StorageBackendsListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: backends = [], isLoading, error } = usePrivateStorageBackends();

  return (
    <>
      {!error && (
        <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
          <FlexItem>
            <Button variant="primary" onClick={() => navigate('/admin/storage/backends/create')}>
              {t('Create backend')}
            </Button>
          </FlexItem>
        </Flex>
      )}
      <ListPageBody isLoading={isLoading} error={error}>
        {backends.length === 0 ? (
          <SubtleContent component="p">
            {t('No storage backends yet. Create one to get started.')}
          </SubtleContent>
        ) : (
          <StorageBackendsTable backends={backends} />
        )}
      </ListPageBody>
    </>
  );
};
