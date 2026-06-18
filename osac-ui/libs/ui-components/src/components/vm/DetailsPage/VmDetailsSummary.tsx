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
} from '@patternfly/react-core';
import GlobeIcon from '@patternfly/react-icons/dist/esm/icons/globe-icon';
import MemoryIcon from '@patternfly/react-icons/dist/esm/icons/memory-icon';
import MicrochipIcon from '@patternfly/react-icons/dist/esm/icons/microchip-icon';
import NetworkWiredIcon from '@patternfly/react-icons/dist/esm/icons/network-wired-icon';

import type { ComputeInstance } from '@osac/types';

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

interface VmDetailsSummaryProps {
  vm: ComputeInstance;
}

export const VmDetailsSummary = ({ vm }: VmDetailsSummaryProps) => {
  const cores = vm.spec?.cores;
  const memoryGib = vm.spec?.memoryGib;
  const publicIp = vm.status?.publicIpAddress;
  const internalIp = vm.status?.internalIpAddress;

  return (
    <Grid hasGutter role="group" aria-label="Virtual machine summary">
      <GridItem sm={6} md={3}>
        <SummaryCard icon={MicrochipIcon} title="vCPU">
          {cores ?? '—'}
        </SummaryCard>
      </GridItem>
      <GridItem sm={6} md={3}>
        <SummaryCard icon={MemoryIcon} title="Memory">
          {memoryGib != null ? `${memoryGib} GiB` : '—'}
        </SummaryCard>
      </GridItem>
      <GridItem sm={6} md={3}>
        <SummaryCard icon={GlobeIcon} title="Public IP">
          {publicIp || '—'}
        </SummaryCard>
      </GridItem>
      <GridItem sm={6} md={3}>
        <SummaryCard icon={NetworkWiredIcon} title="Internal IP">
          {internalIp || '—'}
        </SummaryCard>
      </GridItem>
    </Grid>
  );
};
