import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  Content,
  Flex,
  FlexItem,
  Label,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';

import type { ComputeInstance } from '@osac/types';

import { COMPUTE_INSTANCE_STATE, readComputeInstanceState } from './vmDisplayState';

import './NetworkTopologyPage.css';

interface NetworkTopologyProps {
  vms: ComputeInstance[];
  onOpenVirtualMachineDetail?: (vmId: string) => void;
}

interface SubnetGroup {
  subnet: string;
  vms: ComputeInstance[];
}

const wireField = (obj: unknown, ...keys: string[]): unknown => {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  const rec = obj as Record<string, unknown>;
  for (const key of keys) {
    if (key in rec && rec[key] != null) {
      return rec[key];
    }
  }
  return undefined;
};

const wireStr = (obj: unknown, ...keys: string[]): string | undefined => {
  const value = wireField(obj, ...keys);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const readSubnet = (vm: ComputeInstance): string => {
  const typedSubnet = vm.spec?.networkAttachments?.[0]?.subnet?.trim();
  if (typedSubnet) {
    return typedSubnet;
  }
  const attachments = wireField(vm.spec, 'network_attachments', 'networkAttachments');
  if (Array.isArray(attachments) && attachments[0] && typeof attachments[0] === 'object') {
    const subnet = wireStr(attachments[0], 'subnet');
    if (subnet) {
      return subnet;
    }
  }
  return wireStr(vm.spec, 'subnet') ?? 'default';
};

const readIpAddress = (vm: ComputeInstance): string | undefined => {
  return (
    vm.status?.publicIpAddress?.trim() ||
    vm.status?.internalIpAddress?.trim() ||
    wireStr(vm.status, 'public_ip_address', 'publicIpAddress') ||
    wireStr(vm.status, 'internal_ip_address', 'internalIpAddress', 'ipAddress')
  );
};

const groupBySubnet = (vms: ComputeInstance[]): SubnetGroup[] => {
  const map = new Map<string, ComputeInstance[]>();
  for (const vm of vms) {
    const key = readSubnet(vm);
    const list = map.get(key) ?? [];
    list.push(vm);
    map.set(key, list);
  }
  return Array.from(map.entries()).map(([subnet, vms]) => ({ subnet, vms }));
};

const vmChipStateClass = (state: string): string => {
  if (state === COMPUTE_INSTANCE_STATE.RUNNING) {
    return 'osac-network-topology__vm-chip--running';
  }
  if (state === COMPUTE_INSTANCE_STATE.PAUSED) {
    return 'osac-network-topology__vm-chip--paused';
  }
  if (state === COMPUTE_INSTANCE_STATE.STOPPED) {
    return 'osac-network-topology__vm-chip--stopped';
  }
  if (state === COMPUTE_INSTANCE_STATE.STARTING) {
    return 'osac-network-topology__vm-chip--starting';
  }
  if (state === COMPUTE_INSTANCE_STATE.STOPPING || state === COMPUTE_INSTANCE_STATE.DELETING) {
    return 'osac-network-topology__vm-chip--transitional';
  }
  if (state === COMPUTE_INSTANCE_STATE.FAILED) {
    return 'osac-network-topology__vm-chip--error';
  }
  return '';
};

const stateDotClass = (state: string): string => {
  if (state === COMPUTE_INSTANCE_STATE.RUNNING) {
    return 'osac-network-topology__state-dot--running';
  }
  if (state === COMPUTE_INSTANCE_STATE.PAUSED) {
    return 'osac-network-topology__state-dot--paused';
  }
  if (state === COMPUTE_INSTANCE_STATE.STOPPED) {
    return 'osac-network-topology__state-dot--stopped';
  }
  if (state === COMPUTE_INSTANCE_STATE.STARTING) {
    return 'osac-network-topology__state-dot--starting';
  }
  if (state === COMPUTE_INSTANCE_STATE.STOPPING || state === COMPUTE_INSTANCE_STATE.DELETING) {
    return 'osac-network-topology__state-dot--transitional';
  }
  if (state === COMPUTE_INSTANCE_STATE.FAILED) {
    return 'osac-network-topology__state-dot--error';
  }
  return '';
};

export const NetworkTopologyPage = ({ vms }: NetworkTopologyProps) => {
  const navigate = useNavigate();
  const groups = groupBySubnet(vms);

  return (
    <Stack hasGutter className="osac-network-topology">
      {groups.map((group) => (
        <StackItem key={group.subnet}>
          <Card isCompact>
            <CardBody>
              <Stack hasGutter>
                <StackItem>
                  <Flex
                    alignItems={{ default: 'alignItemsCenter' }}
                    spaceItems={{ default: 'spaceItemsSm' }}
                  >
                    <FlexItem>
                      <Title
                        headingLevel="h3"
                        size="md"
                        className="osac-network-topology__subnet-title"
                      >
                        🔗 {group.subnet}
                      </Title>
                    </FlexItem>
                    <FlexItem>
                      <Label color="blue" isCompact variant="outline">
                        Subnet
                      </Label>
                    </FlexItem>
                  </Flex>
                </StackItem>
                <StackItem>
                  <Flex flexWrap={{ default: 'wrap' }} spaceItems={{ default: 'spaceItemsSm' }}>
                    {group.vms.map((vm) => {
                      const displayState = readComputeInstanceState(vm);
                      const ipAddress = readIpAddress(vm);
                      const chipClass = [
                        'osac-network-topology__vm-chip',
                        vmChipStateClass(displayState),
                        'osac-network-topology__vm-chip--clickable',
                      ]
                        .filter(Boolean)
                        .join(' ');
                      const dotClass = [
                        'osac-network-topology__state-dot',
                        stateDotClass(displayState),
                      ]
                        .filter(Boolean)
                        .join(' ');
                      return (
                        <FlexItem key={vm.id}>
                          <Button
                            variant="plain"
                            onClick={() => navigate(`/vms/${vm.id}`)}
                            className={chipClass}
                            aria-label={`VM ${vm.metadata?.name ?? vm.id}, state ${displayState}, click to view detail`}
                          >
                            <Stack>
                              <StackItem>
                                <Content component="p" className="osac-network-topology__vm-name">
                                  {vm.metadata?.name ?? vm.id}
                                </Content>
                              </StackItem>
                              <StackItem>
                                <Flex
                                  alignItems={{ default: 'alignItemsCenter' }}
                                  spaceItems={{ default: 'spaceItemsXs' }}
                                >
                                  <FlexItem className={dotClass} aria-hidden />
                                  <FlexItem>
                                    <Content
                                      component="small"
                                      className="osac-network-topology__vm-meta"
                                    >
                                      {displayState}
                                      {ipAddress ? ` · ${ipAddress}` : ''}
                                    </Content>
                                  </FlexItem>
                                </Flex>
                              </StackItem>
                            </Stack>
                          </Button>
                        </FlexItem>
                      );
                    })}
                  </Flex>
                </StackItem>
              </Stack>
            </CardBody>
          </Card>
        </StackItem>
      ))}
    </Stack>
  );
};
