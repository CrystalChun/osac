import type { ComponentType, ReactNode, SVGProps } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Icon,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import CubeIcon from '@patternfly/react-icons/dist/esm/icons/cube-icon';
import NetworkWiredIcon from '@patternfly/react-icons/dist/esm/icons/network-wired-icon';
import ServerIcon from '@patternfly/react-icons/dist/esm/icons/server-icon';

import type { Cluster } from '@osac/types';

import { useTranslation } from '../../../hooks/useTranslation';
import { displayValue } from '../../../utils/detailFormatters';

type SummaryIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface SummaryCardProps {
  icon: SummaryIcon;
  title: string;
  children: ReactNode;
}

const SummaryCard = ({ icon: SummaryIconComponent, title, children }: SummaryCardProps) => (
  <Card isFullHeight>
    <CardTitle>
      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
        <FlexItem>
          <Icon size="md">
            <SummaryIconComponent aria-hidden />
          </Icon>
        </FlexItem>
        <FlexItem>{title}</FlexItem>
      </Flex>
    </CardTitle>
    <CardBody>{children}</CardBody>
  </Card>
);

interface ClusterDetailsSummaryProps {
  cluster: Cluster;
}

const ClusterDetailsSummary = ({ cluster }: ClusterDetailsSummaryProps) => {
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

  const podCidr = displayValue(cluster.spec?.network?.podCidr);
  const serviceCidr = displayValue(cluster.spec?.network?.serviceCidr);
  const apiUrl = displayValue(cluster.status?.apiUrl);
  const consoleUrl = displayValue(cluster.status?.consoleUrl);

  return (
    <Grid hasGutter role="group" aria-label={t('Cluster summary')}>
      <GridItem sm={6} md={3}>
        <SummaryCard icon={ServerIcon} title={t('Worker nodes')}>
          {totalWorkers === desiredWorkers ? totalWorkers : `${totalWorkers}/${desiredWorkers}`}
        </SummaryCard>
      </GridItem>
      <GridItem sm={6} md={3}>
        <SummaryCard icon={NetworkWiredIcon} title={t('Networking')}>
          <Stack hasGutter>
            <StackItem>
              <div>
                {t('Pod CIDR')}: {podCidr}
              </div>
            </StackItem>
            <StackItem>
              <div>
                {t('Service CIDR')}: {serviceCidr}
              </div>
            </StackItem>
          </Stack>
        </SummaryCard>
      </GridItem>
      <GridItem sm={6} md={3}>
        <SummaryCard icon={CubeIcon} title={t('Access')}>
          <Stack hasGutter>
            <StackItem>
              <div>
                {t('API URL')}: {apiUrl}
              </div>
            </StackItem>
            <StackItem>
              <div>
                {t('Console URL')}: {consoleUrl}
              </div>
            </StackItem>
          </Stack>
        </SummaryCard>
      </GridItem>
    </Grid>
  );
};

export default ClusterDetailsSummary;
