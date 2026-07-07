/**
 * flow: cluster-service-catalog
 * step: csc_clusters_list
 */
import { useNavigate } from 'react-router-dom';
import { Alert, Button } from '@patternfly/react-core';

import { ClustersTable } from './ClustersTable';
import { useClusters } from '../../api/v1/cluster';
import { useSession } from '../../hooks/use-session';
import ListPage from '../Page/ListPage';
import ListPageBody from '../Page/ListPageBody';

export const ClustersPage = () => {
  const navigate = useNavigate();
  const { role } = useSession();
  const { data: clusters = [], isLoading, error } = useClusters();

  return (
    <ListPage
      title="Clusters"
      description="OpenShift clusters provisioned for your organization."
      error={error}
      actions={
        role === 'tenantUser' ? (
          <Button variant="primary" onClick={() => navigate('/clusters/create')}>
            Create cluster
          </Button>
        ) : undefined
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
