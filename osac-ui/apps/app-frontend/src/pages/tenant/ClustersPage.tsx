/**
 * flow: cluster-service-catalog
 * step: csc_clusters_list
 */
import { Alert, Bullseye, Button, PageSection, Spinner } from '@patternfly/react-core';

import { useClusters } from '@osac/ui-components/api/v1/cluster';

import { ClustersTable } from '../../components/cluster/ClustersTable';
import { PageHeader } from '../../components/layout/PageHeader';

export const ClustersPage = () => {
  const { data: clusters = [], isLoading, isError, refetch } = useClusters();

  return (
    <PageSection>
      <PageHeader
        title="Clusters"
        description="OpenShift clusters provisioned for your organization."
      />

      {isLoading ? (
        <Bullseye className="osac-data-table__loading">
          <Spinner aria-label="Loading clusters" />
        </Bullseye>
      ) : isError ? (
        <Alert
          variant="danger"
          isInline
          title="Could not load clusters"
          actionLinks={
            <Button variant="link" isInline onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          Unable to load clusters right now. Please try again.
        </Alert>
      ) : clusters.length === 0 ? (
        <Alert variant="info" isInline title="No clusters found">
          No clusters are provisioned for your organization yet.
        </Alert>
      ) : (
        <ClustersTable clusters={clusters} />
      )}
    </PageSection>
  );
};
