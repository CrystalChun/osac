import { Grid, GridItem } from '@patternfly/react-core';

import type { Cluster } from '@osac/types';

import { ClusterAccessCard } from './ClusterAccessCard';
import { ClusterConfigurationCard } from './ClusterConfigurationCard';

interface ClusterOverviewTabProps {
  cluster: Cluster;
}

export const ClusterOverviewTab = ({ cluster }: ClusterOverviewTabProps) => {
  return (
    <Grid hasGutter>
      <GridItem md={7}>
        <ClusterConfigurationCard cluster={cluster} />
      </GridItem>
      <GridItem md={5}>
        <ClusterAccessCard cluster={cluster} />
      </GridItem>
    </Grid>
  );
};
