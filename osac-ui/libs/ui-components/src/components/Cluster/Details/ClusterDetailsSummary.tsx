import { Card, CardBody, CardTitle, Grid, GridItem } from '@patternfly/react-core';

import type { Cluster } from '@osac/types';

import { useTranslation } from '../../../hooks/useTranslation';

interface ClusterDetailsSummaryProps {
  cluster: Cluster;
}

export const ClusterDetailsSummary = ({ cluster }: ClusterDetailsSummaryProps) => {
  const { t } = useTranslation();

  // Calculate total worker nodes across all node sets
  const nodeSetsSpec = cluster.spec?.nodeSets ?? {};
  const nodeSetsStatus = cluster.status?.nodeSets ?? {};
  const totalWorkers = Object.values(nodeSetsStatus).reduce(
    (sum, nodeSet) => sum + (nodeSet?.size ?? 0),
    0,
  );
  const desiredWorkers = Object.values(nodeSetsSpec).reduce(
    (sum, nodeSet) => sum + (nodeSet?.size ?? 0),
    0,
  );

  const podCidr = cluster.spec?.network?.podCidr ?? '—';
  const serviceCidr = cluster.spec?.network?.serviceCidr ?? '—';
  const apiUrl = cluster.status?.apiUrl ?? '—';
  const consoleUrl = cluster.status?.consoleUrl ?? '—';

  return (
    <Grid hasGutter span={3}>
      <GridItem>
        <Card isCompact>
          <CardTitle>{t('Worker nodes')}</CardTitle>
          <CardBody>
            {totalWorkers === desiredWorkers ? totalWorkers : `${totalWorkers}/${desiredWorkers}`}
          </CardBody>
        </Card>
      </GridItem>
      <GridItem>
        <Card isCompact>
          <CardTitle>{t('Pod CIDR')}</CardTitle>
          <CardBody>{podCidr}</CardBody>
        </Card>
      </GridItem>
      <GridItem>
        <Card isCompact>
          <CardTitle>{t('Service CIDR')}</CardTitle>
          <CardBody>{serviceCidr}</CardBody>
        </Card>
      </GridItem>
      <GridItem>
        <Card isCompact>
          <CardTitle>{t('API URL')}</CardTitle>
          <CardBody>{apiUrl}</CardBody>
        </Card>
      </GridItem>
      <GridItem>
        <Card isCompact>
          <CardTitle>{t('Console URL')}</CardTitle>
          <CardBody>{consoleUrl}</CardBody>
        </Card>
      </GridItem>
    </Grid>
  );
};
