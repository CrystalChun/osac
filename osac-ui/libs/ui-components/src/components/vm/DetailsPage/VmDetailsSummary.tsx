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
  Spinner,
} from '@patternfly/react-core';
import GlobeIcon from '@patternfly/react-icons/dist/esm/icons/globe-icon';
import NetworkWiredIcon from '@patternfly/react-icons/dist/esm/icons/network-wired-icon';
import ServerIcon from '@patternfly/react-icons/dist/esm/icons/server-icon';

import type { ComputeInstance } from '@osac/types';

import { formatInstanceTypeDisplayName, useInstanceType } from '../../../api/v1/instance-types';
import { useTranslation } from '../../../hooks/useTranslation';

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

const VmDetailsSummary = ({ vm }: VmDetailsSummaryProps) => {
  const { t } = useTranslation();
  const instanceTypeId = vm.spec?.instanceType;
  const { data: instanceType, isLoading: isInstanceTypeLoading } = useInstanceType(instanceTypeId);
  const publicIp = vm.status?.publicIpAddress;
  const internalIp = vm.status?.internalIpAddress;

  const instanceTypeLabel = formatInstanceTypeDisplayName(
    instanceType,
    t('catalogProvision.instanceTypes.deprecatedSuffix'),
    instanceTypeId,
  );

  return (
    <Grid hasGutter role="group" aria-label={t('vm.details.summary.ariaLabel')}>
      <GridItem sm={6} md={4}>
        <SummaryCard icon={ServerIcon} title={t('catalogProvision.vm.fields.instanceType')}>
          {isInstanceTypeLoading && instanceTypeId?.trim() ? (
            <Spinner size="sm" aria-label={t('vm.details.summary.loadingInstanceType')} />
          ) : (
            instanceTypeLabel
          )}
        </SummaryCard>
      </GridItem>
      <GridItem sm={6} md={4}>
        <SummaryCard icon={GlobeIcon} title={t('vm.details.summary.publicIp')}>
          {publicIp || '—'}
        </SummaryCard>
      </GridItem>
      <GridItem sm={6} md={4}>
        <SummaryCard icon={NetworkWiredIcon} title={t('vm.details.summary.internalIp')}>
          {internalIp || '—'}
        </SummaryCard>
      </GridItem>
    </Grid>
  );
};

export default VmDetailsSummary;
