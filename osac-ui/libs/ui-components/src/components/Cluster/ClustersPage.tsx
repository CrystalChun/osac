import { useNavigate } from 'react-router-dom';
import { Alert, Button } from '@patternfly/react-core';

import { useClusters } from '@osac/ui-components/api/v1/cluster';

import { ClustersTable } from './ClustersTable';
import { useTranslation } from '../../hooks/useTranslation';
import ListPage from '../Page/ListPage';
import ListPageBody from '../Page/ListPageBody';

export const ClustersPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: clusters = [], isLoading, error } = useClusters();

  return (
    <ListPage
      title="Clusters"
      description="OpenShift clusters provisioned for your organization."
      error={error}
      actions={
        <Button variant="primary" onClick={() => navigate('/clusters/create')}>
          {t('Create cluster')}
        </Button>
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        {clusters.length === 0 ? (
          <Alert variant="info" isInline title="No clusters found">
            No clusters are provisioned for your organization yet.
          </Alert>
        ) : (
          <ClustersTable clusters={clusters} />
        )}
      </ListPageBody>
    </ListPage>
  );
};
