import { Card, CardBody, CardTitle, Grid, GridItem } from '@patternfly/react-core';

import type { Cluster } from '@osac/types';

import { ClusterConfigurationCard } from './ClusterConfigurationCard';
import { useTranslation } from '../../../hooks/useTranslation';
import { ResourceConditionsTable } from '../../Resource/ResourceConditionsTable';

interface ClusterOverviewTabProps {
  cluster: Cluster;
}

export const ClusterOverviewTab = ({ cluster }: ClusterOverviewTabProps) => {
  const { t } = useTranslation();

  const conditions = cluster.status?.conditions ?? [];

  return (
    <Grid hasGutter>
      <GridItem md={8}>
        <ClusterConfigurationCard cluster={cluster} />
      </GridItem>
      <GridItem md={4}>
        <Card isFullHeight>
          <CardTitle>{t('Conditions')}</CardTitle>
          <CardBody>
            <ResourceConditionsTable
              ariaLabel={t('Cluster conditions')}
              conditions={conditions}
              conditionResourceKind="cluster"
            />
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );
};
