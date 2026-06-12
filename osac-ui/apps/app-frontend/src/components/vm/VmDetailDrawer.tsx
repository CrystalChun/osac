import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  PageSection,
  Stack,
  StackItem,
  Tab,
  TabTitleText,
  Tabs,
  Title,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useState } from 'react';
import './VmDetailDrawer.css';
import type { ComputeInstance, VmPowerState } from '@osac/api-contracts/types';
import {
  formatConditionStatusForDisplay,
  shortSubnetDisplay,
} from '@osac/api-contracts/computeInstanceNormalize';
import { VmStatusLabel } from '@osac/ui-components/VmStatusLabel';
import { VmActionsMenu } from './VmActionsMenu';
import { useNavigate } from 'react-router-dom';

interface Props {
  vm: ComputeInstance | null;
  effectiveState: VmPowerState;
  onPower: (action: 'start' | 'stop' | 'restart') => void;
  onDelete?: () => void;
  /* RESTORE when fulfillment supports clone: onClone?: () => void */
  isRestarting?: boolean;
  isPowerActionPending?: boolean;
}

const humanizeConditionType = (type: string): string => {
  return type.replace(/^CONDITION_TYPE_/i, '').replace(/_/g, ' ') || type;
};

const formatIsoDate = (iso?: string): string => {
  if (!iso?.trim()) {
    return '—';
  }
  const t = Date.parse(iso.trim());
  return Number.isNaN(t) ? iso : new Date(t).toLocaleString();
};

export const VmDetailDrawer = ({
  vm,
  effectiveState,
  onPower,
  onDelete,
  isRestarting = false,
  isPowerActionPending = false,
}: Props) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  if (!vm) {
    return null;
  }

  const tenantsLine = vm.metadata.tenants?.length ? vm.metadata.tenants.join(', ') : '—';
  const creatorsLine = vm.metadata.creators?.length ? vm.metadata.creators.join(', ') : '—';

  return (
    <Stack hasGutter>
      <StackItem>
        <Breadcrumb>
          <BreadcrumbItem>
            <Button variant="link" isInline onClick={() => navigate('/vms')}>
              Virtual machines
            </Button>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{vm.metadata.name}</BreadcrumbItem>
        </Breadcrumb>
      </StackItem>

      <StackItem>
        <Stack hasGutter={false}>
          <StackItem>
            <Title headingLevel="h1" size="2xl">
              {vm.metadata.name}
            </Title>
          </StackItem>
          {vm.description && (
            <StackItem>
              <Content component="p" className="osac-vm-detail__description">
                {vm.description}
              </Content>
            </StackItem>
          )}
        </Stack>
      </StackItem>

      <StackItem>
        <Divider />
      </StackItem>

      <StackItem>
        <div className="osac-vm-detail-layout">
          <Card isFullHeight className="osac-vm-detail-main-card">
            <CardBody>
              <Tabs
                activeKey={activeTab}
                onSelect={(_e, key) => setActiveTab(Number(key))}
                className="osac-vm-detail-tabs"
              >
                <Tab eventKey={0} title={<TabTitleText>Overview</TabTitleText>}>
                  <PageSection hasBodyWrapper={false} className="osac-vm-detail__tab-panel">
                    <DescriptionList isCompact>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Name</DescriptionListTerm>
                        <DescriptionListDescription>{vm.metadata.name}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Template</DescriptionListTerm>
                        <DescriptionListDescription>
                          {vm.spec.template ?? '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Run strategy</DescriptionListTerm>
                        <DescriptionListDescription>
                          {vm.spec.runStrategy ?? '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>vCPU</DescriptionListTerm>
                        <DescriptionListDescription>
                          {vm.spec.cores ?? '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Memory</DescriptionListTerm>
                        <DescriptionListDescription>
                          {vm.spec.memoryGib != null ? `${vm.spec.memoryGib} GiB` : '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      {vm.description && (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Description</DescriptionListTerm>
                          <DescriptionListDescription>{vm.description}</DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                      <DescriptionListGroup>
                        <DescriptionListTerm>Created</DescriptionListTerm>
                        <DescriptionListDescription>
                          {vm.metadata.createdAt ? formatIsoDate(vm.metadata.createdAt) : '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Tenants</DescriptionListTerm>
                        <DescriptionListDescription>{tenantsLine}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Creators</DescriptionListTerm>
                        <DescriptionListDescription>{creatorsLine}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Version</DescriptionListTerm>
                        <DescriptionListDescription>
                          {vm.metadata.version != null ? String(vm.metadata.version) : '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </PageSection>
                </Tab>

                <Tab eventKey={1} title={<TabTitleText>Networking</TabTitleText>}>
                  <PageSection hasBodyWrapper={false} className="osac-vm-detail__tab-panel">
                    <DescriptionList isCompact>
                      <DescriptionListGroup>
                        <DescriptionListTerm>IP address</DescriptionListTerm>
                        <DescriptionListDescription>
                          {vm.status.ipAddress ?? '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Subnet</DescriptionListTerm>
                        <DescriptionListDescription>
                          {shortSubnetDisplay(vm.spec.subnet)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Security groups</DescriptionListTerm>
                        <DescriptionListDescription>
                          {vm.spec.securityGroups?.join(', ') ?? '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </PageSection>
                </Tab>

                <Tab eventKey={2} title={<TabTitleText>Conditions</TabTitleText>}>
                  <PageSection hasBodyWrapper={false} className="osac-vm-detail__tab-panel">
                    {vm.status.conditions && vm.status.conditions.length > 0 ? (
                      <Table aria-label="Virtual machine conditions" variant="compact">
                        <Thead>
                          <Tr>
                            <Th>Type</Th>
                            <Th>Status</Th>
                            <Th>Reason</Th>
                            <Th>Message</Th>
                            <Th>Last transition</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {vm.status.conditions.map((c, i) => (
                            <Tr key={`${c.type}-${i}`}>
                              <Td dataLabel="Type">{humanizeConditionType(c.type)}</Td>
                              <Td dataLabel="Status">
                                {formatConditionStatusForDisplay(c.status)}
                              </Td>
                              <Td dataLabel="Reason">{c.reason ?? '—'}</Td>
                              <Td dataLabel="Message">{c.message ?? '—'}</Td>
                              <Td dataLabel="Last transition">
                                {formatIsoDate(c.lastTransitionTime)}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    ) : (
                      <Content component="p" className="osac-vm-detail__empty-state">
                        No conditions reported.
                      </Content>
                    )}
                  </PageSection>
                </Tab>
              </Tabs>
            </CardBody>
          </Card>

          <Card isFullHeight className="osac-vm-detail-console-card">
            <CardHeader>
              <Flex
                justifyContent={{ default: 'justifyContentSpaceBetween' }}
                alignItems={{ default: 'alignItemsCenter' }}
                className="osac-vm-detail-actions__header-row"
              >
                <CardTitle>Actions</CardTitle>
                <VmActionsMenu
                  vm={vm}
                  effectiveState={effectiveState}
                  isRestarting={isRestarting}
                  isPowerActionPending={isPowerActionPending}
                  onPower={onPower}
                  onDelete={onDelete}
                />
              </Flex>
            </CardHeader>
            <CardBody>
              <Stack hasGutter>
                <StackItem>
                  <VmStatusLabel state={effectiveState} />
                </StackItem>
                <StackItem>
                  <Content component="p" className="osac-vm-detail-actions__ip-line">
                    <strong>IP address:</strong> {vm.status.ipAddress ?? '—'}
                  </Content>
                </StackItem>
              </Stack>
            </CardBody>
          </Card>
        </div>
      </StackItem>
    </Stack>
  );
};
