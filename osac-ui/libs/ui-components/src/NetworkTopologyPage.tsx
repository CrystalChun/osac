import type { ComputeInstance } from '@osac/api-contracts/types';
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
import { useNavigate } from 'react-router-dom';

import './NetworkTopologyPage.css';

interface NetworkTopologyProps {
  vms: ComputeInstance[];
  onOpenVirtualMachineDetail?: (vmId: string) => void;
}

interface SubnetGroup {
  subnet: string;
  vms: ComputeInstance[];
}

const groupBySubnet = (vms: ComputeInstance[]): SubnetGroup[] => {
  const map = new Map<string, ComputeInstance[]>();
  for (const vm of vms) {
    const key = vm.spec.subnet ?? 'default';
    const list = map.get(key) ?? [];
    list.push(vm);
    map.set(key, list);
  }
  return Array.from(map.entries()).map(([subnet, vms]) => ({ subnet, vms }));
};

const vmChipStateClass = (state: string): string => {
  if (state === 'running') {
    return 'osac-network-topology__vm-chip--running';
  }
  if (state === 'paused') {
    return 'osac-network-topology__vm-chip--paused';
  }
  if (state === 'stopped') {
    return 'osac-network-topology__vm-chip--stopped';
  }
  if (state === 'starting' || state === 'creating' || state === 'still_provisioning') {
    return 'osac-network-topology__vm-chip--starting';
  }
  if (state === 'stopping' || state === 'restarting' || state === 'deleting') {
    return 'osac-network-topology__vm-chip--transitional';
  }
  if (state === 'error') {
    return 'osac-network-topology__vm-chip--error';
  }
  return '';
};

const stateDotClass = (state: string): string => {
  if (state === 'running') {
    return 'osac-network-topology__state-dot--running';
  }
  if (state === 'paused') {
    return 'osac-network-topology__state-dot--paused';
  }
  if (state === 'stopped') {
    return 'osac-network-topology__state-dot--stopped';
  }
  if (state === 'starting' || state === 'creating' || state === 'still_provisioning') {
    return 'osac-network-topology__state-dot--starting';
  }
  if (state === 'stopping' || state === 'restarting' || state === 'deleting') {
    return 'osac-network-topology__state-dot--transitional';
  }
  if (state === 'error') {
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
                      const chipClass = [
                        'osac-network-topology__vm-chip',
                        vmChipStateClass(vm.status.state),
                        'osac-network-topology__vm-chip--clickable',
                      ]
                        .filter(Boolean)
                        .join(' ');
                      const dotClass = [
                        'osac-network-topology__state-dot',
                        stateDotClass(vm.status.state),
                      ]
                        .filter(Boolean)
                        .join(' ');
                      return (
                        <FlexItem key={vm.id}>
                          <Button
                            variant="plain"
                            onClick={() => navigate(`/vms/${vm.id}`)}
                            className={chipClass}
                            aria-label={`VM ${vm.metadata.name}, state ${vm.status.state}, click to view detail`}
                          >
                            <Stack>
                              <StackItem>
                                <Content component="p" className="osac-network-topology__vm-name">
                                  {vm.metadata.name}
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
                                      {vm.status.state}
                                      {vm.status.ipAddress ? ` · ${vm.status.ipAddress}` : ''}
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
