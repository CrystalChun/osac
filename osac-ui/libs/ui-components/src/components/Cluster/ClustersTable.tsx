/**
 * flow: cluster-service-catalog
 * step: csc_clusters_list
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import DumpsterIcon from '@patternfly/react-icons/dist/esm/icons/dumpster-icon';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { Cluster } from '@osac/types';

import { ClusterDeleteConfirmModal } from './ClusterDeleteConfirmModal';
import { ClusterStatusLabel } from './ClusterStatusLabel';
import { useTranslation } from '../../hooks/useTranslation';
import ExternalLink from '../Primitives/ExternalLink';
import { Timestamp } from '../Primitives/Timestamp';

interface ClustersTableProps {
  clusters: Cluster[];
}

export const ClustersTable = ({ clusters }: ClustersTableProps) => {
  const { t } = useTranslation();
  const [clusterToDelete, setClusterToDelete] = useState<Cluster | null>(null);

  return (
    <>
      {clusterToDelete && (
        <ClusterDeleteConfirmModal
          cluster={clusterToDelete}
          onClose={() => setClusterToDelete(null)}
          onSuccess={() => setClusterToDelete(null)}
        />
      )}
      <Table aria-label="Clusters">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Status</Th>
            <Th>API URL</Th>
            <Th>Created</Th>
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {clusters.map((cluster) => {
            const apiUrl = cluster.status?.apiUrl;
            return (
              <Tr key={cluster.id}>
                <Td dataLabel="Name">
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
                <Td isActionCell>
                  <Button
                    variant="plain"
                    icon={<DumpsterIcon />}
                    aria-label={t('Delete cluster')}
                    onClick={() => setClusterToDelete(cluster)}
                  />
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </>
  );
};
