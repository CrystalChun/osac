/**
 * flow: cluster-service-catalog
 * step: csc_clusters_list
 */
import {
  Alert,
  Bullseye,
  Button,
  Content,
  PageSection,
  Spinner,
  Title,
} from '@patternfly/react-core';

import { ClustersTable } from './ClustersTable';
import { useClusters } from '../../api/v1/cluster';

export const ClustersPage = () => {
  const { data: clusters = [], isLoading, isError, refetch } = useClusters();

  return (
    <PageSection>
      <Title headingLevel="h1" size="2xl">
        Clusters
      </Title>
      <Content component="p">OpenShift clusters provisioned for your organization.</Content>

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
