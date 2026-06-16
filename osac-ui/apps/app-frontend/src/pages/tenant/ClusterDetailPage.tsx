/**
 * flow: cluster-service-catalog
 * step: csc_cluster_detail
 */
import { Link, useParams } from 'react-router-dom';
import { Alert, Bullseye, Button, PageSection, Spinner } from '@patternfly/react-core';

import { useCluster } from '@osac/ui-components/api/v1/cluster';

import { ClusterDetailView } from '../../components/cluster/ClusterDetailView';

export const ClusterDetailPage = () => {
  const { clusterId } = useParams() as { clusterId: string };
  const { data: cluster, isLoading, isError, refetch } = useCluster(clusterId);

  return (
    <PageSection>
      {isLoading ? (
        <Bullseye className="osac-data-table__loading">
          <Spinner aria-label="Loading cluster" />
        </Bullseye>
      ) : isError ? (
        <Alert
          variant="danger"
          isInline
          title="Could not load cluster"
          actionLinks={
            <Button variant="link" isInline onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          Unable to load this cluster right now. <Link to="/clusters">Return to clusters</Link>.
        </Alert>
      ) : !cluster ? (
        <Alert variant="warning" isInline title="Cluster not found">
          This cluster could not be found. <Link to="/clusters">Return to clusters</Link>.
        </Alert>
      ) : (
        <ClusterDetailView cluster={cluster} />
      )}
    </PageSection>
  );
};
