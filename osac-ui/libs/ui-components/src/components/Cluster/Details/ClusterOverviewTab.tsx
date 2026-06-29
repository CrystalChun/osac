import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type { Cluster } from '@osac/types';

import { ClusterAccessCard } from './ClusterAccessCard';
import { ClusterConfigurationCard } from './ClusterConfigurationCard';
import { useTranslation } from '../../../hooks/useTranslation';
import { ResourceConditionsTable } from '../../Resource/ResourceConditionsTable';

interface ClusterOverviewTabProps {
  cluster: Cluster;
}

export const ClusterOverviewTab = ({ cluster }: ClusterOverviewTabProps) => {
  const { t } = useTranslation();

  const nodeSets = cluster.status?.nodeSets ?? {};
  const conditions = cluster.status?.conditions ?? [];

  // Calculate total workers from all node sets
  const totalWorkers = Object.values(nodeSets).reduce(
    (sum, nodeSet) => sum + (nodeSet?.size ?? 0),
    0,
  );

  return (
    <Grid hasGutter>
      <GridItem md={8}>
        <Stack hasGutter>
          <StackItem>
            <ClusterConfigurationCard cluster={cluster} />
          </StackItem>
          <StackItem>
            <ClusterAccessCard cluster={cluster} />
          </StackItem>
          <StackItem>
            <Card isFullHeight>
              <CardTitle>{t('Node sets')}</CardTitle>
              <CardBody>
                <DescriptionList isHorizontal isCompact>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Total worker nodes')}</DescriptionListTerm>
                    <DescriptionListDescription>{totalWorkers}</DescriptionListDescription>
                  </DescriptionListGroup>
                  {Object.entries(nodeSets).map(([name, nodeSet]) => (
                    <DescriptionListGroup key={name}>
                      <DescriptionListTerm>{name}</DescriptionListTerm>
                      <DescriptionListDescription>
                        {t('{{size}} nodes', { size: nodeSet?.size ?? 0 })} (
                        {nodeSet?.hostType ?? '—'})
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  ))}
                </DescriptionList>
              </CardBody>
            </Card>
          </StackItem>
        </Stack>
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
