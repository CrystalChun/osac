/**
 * flow: cluster-service-catalog
 * step: csc_clusters_list
 */
import { Link } from 'react-router-dom';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { Cluster } from '@osac/types';

import ClusterActionsMenu from './ClusterActionsMenu';
import { ClusterStatusLabel } from './ClusterStatusLabel';
import { useTranslation } from '../../hooks/useTranslation';
import ExternalLink from '../Primitives/ExternalLink';
import { Timestamp } from '../Primitives/Timestamp';

interface ClustersTableProps {
  clusters: Cluster[];
}

export const ClustersTable = ({ clusters }: ClustersTableProps) => {
  const { t } = useTranslation();

  return (
    <Table aria-label={t('Clusters')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('API URL')}</Th>
          <Th>{t('Created')}</Th>
          <Th aria-label={t('Actions')} />
        </Tr>
      </Thead>
      <Tbody>
        {clusters.map((cluster) => {
          const apiUrl = cluster.status?.apiUrl;

          return (
            <Tr key={cluster.id}>
              <Td dataLabel={t('Name')}>
                <Link to={`/clusters/${encodeURIComponent(cluster.id)}`}>
                  {cluster.metadata?.name || cluster.id}
                </Link>
              </Td>
              <Td dataLabel={t('Status')}>
                <ClusterStatusLabel state={cluster.status?.state} />
              </Td>
              <Td dataLabel={t('API URL')}>
                <ExternalLink href={apiUrl} showUnsafeAsText />
              </Td>
              <Td dataLabel={t('Created')}>
                <Timestamp value={cluster.metadata?.creationTimestamp} />
              </Td>
              <Td dataLabel={t('Actions')} isActionCell>
                <ClusterActionsMenu cluster={cluster} />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
