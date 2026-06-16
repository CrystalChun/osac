/**
 * flow: cluster-service-catalog
 * step: csc_clusters_list
 */
import { Link } from 'react-router-dom';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { Cluster } from '@osac/types';
import { ExternalLink } from '@osac/ui-components/ExternalLink';
import { Timestamp } from '@osac/ui-components/Timestamp';

import { ClusterStatusLabel } from './ClusterStatusLabel';

import '../shared/DataTable.css';

interface ClustersTableProps {
  clusters: Cluster[];
}

export const ClustersTable = ({ clusters }: ClustersTableProps) => {
  return (
    <Table aria-label="Clusters">
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Status</Th>
          <Th>API URL</Th>
          <Th>Created</Th>
        </Tr>
      </Thead>
      <Tbody>
        {clusters.map((cluster) => {
          const apiUrl = cluster.status?.apiUrl;
          return (
            <Tr key={cluster.id}>
              <Td dataLabel="Name" className="osac-data-table__primary-cell">
                <Link to={`/clusters/${encodeURIComponent(cluster.id)}`}>
                  {cluster.metadata?.name || cluster.id}
                </Link>
              </Td>
              <Td dataLabel="Status">
                <ClusterStatusLabel state={cluster.status?.state} />
              </Td>
              <Td dataLabel="API URL">
                <ExternalLink href={apiUrl} showUnsafeAsText />
              </Td>
              <Td dataLabel="Created">
                <Timestamp value={cluster.metadata?.creationTimestamp} />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
