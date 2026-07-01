/**
 * flow: cluster-service-catalog
 * step: csc_clusters_list
 */
import { Alert } from '@patternfly/react-core';

import { ClustersTable } from './ClustersTable';
import { useClusters } from '../../api/v1/cluster';
import ListPage from '../Page/ListPage';
import ListPageBody from '../Page/ListPageBody';

export const ClustersPage = () => {
  const { data: clusters = [], isLoading, error } = useClusters();

  return (
    <ListPage
      title="Clusters"
      description="OpenShift clusters provisioned for your organization."
      error={error}
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
