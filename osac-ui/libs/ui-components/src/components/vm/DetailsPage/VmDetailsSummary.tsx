import type { ReactNode } from 'react';
import { Card, CardBody, Flex, FlexItem } from '@patternfly/react-core';

import type { ComputeInstance } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';

import { VmStatusLabel } from '../../../VmStatusLabel';

import './VmDetailsSummary.css';

type SummaryAccentTone = 'green' | 'orange' | 'red' | 'blue' | 'grey';

const powerStateTone = (state?: ComputeInstanceState): SummaryAccentTone => {
  switch (state) {
    case ComputeInstanceState.RUNNING:
      return 'green';
    case ComputeInstanceState.STOPPED:
    case ComputeInstanceState.PAUSED:
      return 'orange';
    case ComputeInstanceState.STARTING:
    case ComputeInstanceState.STOPPING:
      return 'blue';
    case ComputeInstanceState.DELETING:
    case ComputeInstanceState.FAILED:
      return 'red';
    default:
      return 'grey';
  }
};

const resourceSizeTone = (value: number | undefined): SummaryAccentTone => {
  if (value == null) {
    return 'grey';
  }
  if (value <= 2) {
    return 'green';
  }
  if (value <= 8) {
    return 'orange';
  }
  return 'red';
};

const memorySizeTone = (memoryGib: number | undefined): SummaryAccentTone => {
  if (memoryGib == null) {
    return 'grey';
  }
  if (memoryGib <= 4) {
    return 'green';
  }
  if (memoryGib <= 16) {
    return 'orange';
  }
  return 'red';
};

interface SummaryStatCardProps {
  label: string;
  tone: SummaryAccentTone;
  isEmpty?: boolean;
  children: ReactNode;
}

const SummaryStatCard = ({ label, tone, isEmpty = false, children }: SummaryStatCardProps) => {
  const resolvedTone = isEmpty ? 'grey' : tone;

  return (
    <Card
      isPlain
      isFullHeight
      className={`osac-vm-details-summary-card osac-vm-details-summary-card--tone-${resolvedTone}`}
    >
      <CardBody className="osac-vm-details-summary-card__body">
        <span className="osac-vm-details-summary-card__label">{label}</span>
        <div
          className={[
            'osac-vm-details-summary-card__value',
            isEmpty ? 'osac-vm-details-summary-card__value--empty' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {children}
        </div>
      </CardBody>
    </Card>
  );
};

interface VmDetailsSummaryProps {
  vm: ComputeInstance;
}

export const VmDetailsSummary = ({ vm }: VmDetailsSummaryProps) => {
  const state = vm.status?.state;
  const cores = vm.spec?.cores;
  const memoryGib = vm.spec?.memoryGib;
  const publicIp = vm.status?.publicIpAddress;
  const internalIp = vm.status?.internalIpAddress;

  return (
    <Flex
      className="osac-vm-details-summary"
      role="group"
      aria-label="Virtual machine summary"
      spaceItems={{ default: 'spaceItemsMd' }}
      flexWrap={{ default: 'wrap' }}
    >
      <FlexItem className="osac-vm-details-summary__item">
        <SummaryStatCard label="Power state" tone={powerStateTone(state)}>
          <VmStatusLabel state={state} />
        </SummaryStatCard>
      </FlexItem>
      <FlexItem className="osac-vm-details-summary__item">
        <SummaryStatCard label="vCPU" tone={resourceSizeTone(cores)} isEmpty={cores == null}>
          {cores ?? '—'}
        </SummaryStatCard>
      </FlexItem>
      <FlexItem className="osac-vm-details-summary__item">
        <SummaryStatCard
          label="Memory"
          tone={memorySizeTone(memoryGib)}
          isEmpty={memoryGib == null}
        >
          {memoryGib != null ? `${memoryGib} GiB` : '—'}
        </SummaryStatCard>
      </FlexItem>
      <FlexItem className="osac-vm-details-summary__item">
        <SummaryStatCard label="Public IP" tone="blue" isEmpty={!publicIp}>
          {publicIp || '—'}
        </SummaryStatCard>
      </FlexItem>
      <FlexItem className="osac-vm-details-summary__item">
        <SummaryStatCard label="Internal IP" tone="blue" isEmpty={!internalIp}>
          {internalIp || '—'}
        </SummaryStatCard>
      </FlexItem>
    </Flex>
  );
};
