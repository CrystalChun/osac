import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { Cluster, ClusterVersion } from '@osac/types';

import ClusterActionsMenu from './ClusterActionsMenu';
import { ClusterStatusLabel } from './ClusterStatusLabel';
import ClusterVersionLifecycleLabel from './ClusterVersionLifecycleLabel';
import { useTranslation } from '../../hooks/useTranslation';
import ExternalLink from '../Primitives/ExternalLink';
import { Timestamp } from '../Primitives/Timestamp';

interface ClustersTableProps {
  clusters: Cluster[];
  clusterVersions?: ClusterVersion[];
  isClusterVersionsLoading?: boolean;
}

export const ClustersTable = ({
  clusters,
  clusterVersions = [],
  isClusterVersionsLoading = false,
}: ClustersTableProps) => {
  const { t } = useTranslation();

  // Clusters reference versions by spec.version.name, so key the catalog by name.
  const clusterVersionByName = useMemo(
    () => new Map(clusterVersions.map((cv) => [cv.metadata?.name, cv])),
    [clusterVersions],
  );

  return (
    <Table aria-label={t('Clusters')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('Version')}</Th>
          <Th>{t('Lifecycle')}</Th>
          <Th>{t('API URL')}</Th>
          <Th>{t('Created')}</Th>
          <Th aria-label={t('Actions')} />
        </Tr>
      </Thead>
      <Tbody>
        {clusters.map((cluster) => {
          const apiUrl = cluster.status?.apiUrl;
          const versionRef = cluster.spec?.version;
          const clusterVersion = versionRef?.name
            ? clusterVersionByName.get(versionRef.name)
            : undefined;

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
              <Td dataLabel={t('Version')}>
                {isClusterVersionsLoading ? (
                  <Skeleton width="80px" />
                ) : (
                  clusterVersion?.spec?.version || versionRef?.name || '—'
                )}
              </Td>
              <Td dataLabel={t('Lifecycle')}>
                {isClusterVersionsLoading ? (
                  <Skeleton width="80px" />
                ) : clusterVersion ? (
                  <ClusterVersionLifecycleLabel
                    state={clusterVersion.spec?.state}
                    deprecation={clusterVersion.spec?.deprecation}
                  />
                ) : null}
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
