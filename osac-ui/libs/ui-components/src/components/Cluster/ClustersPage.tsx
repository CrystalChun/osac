import { useNavigate } from 'react-router-dom';
import { Alert, Button } from '@patternfly/react-core';

import { useClusters } from '@osac/ui-components/api/v1/cluster';
import {
  CLUSTER_VERSION_ALL_STATES_LIST_FILTER,
  useClusterVersions,
} from '@osac/ui-components/api/v1/cluster-versions';

import { ClustersTable } from './ClustersTable';
import { useTranslation } from '../../hooks/useTranslation';
import ListPage from '../Page/ListPage';
import ListPageBody from '../Page/ListPageBody';

export const ClustersPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: clusters = [], isLoading, error } = useClusters();
  // One List call for the whole catalog (all states, incl. obsolete/disabled),
  // joined per-row in ClustersTable — never one fetch per cluster.
  const { data: clusterVersions = [], isLoading: isClusterVersionsLoading } = useClusterVersions({
    filter: CLUSTER_VERSION_ALL_STATES_LIST_FILTER,
  });

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
          <ClustersTable
            clusters={clusters}
            clusterVersions={clusterVersions}
            isClusterVersionsLoading={isClusterVersionsLoading}
          />
        )}
      </ListPageBody>
    </ListPage>
  );
};
