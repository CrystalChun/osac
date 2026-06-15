import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

import type { ComputeInstance } from '@osac/types';
import { type DisplayVmState } from '@osac/ui-components/vmDisplayState';
import { VmStatusLabel } from '@osac/ui-components/VmStatusLabel';

import { VmActionsMenu } from './VmActionsMenu';

import './VmDetailDrawer.css';

interface Props {
  vm: ComputeInstance | null;
  effectiveState: DisplayVmState;
  onPower: (action: 'start' | 'stop' | 'restart') => void;
  onDelete?: () => void;
  /* RESTORE when fulfillment supports clone: onClone?: () => void */
  isRestarting?: boolean;
  isPowerActionPending?: boolean;
}

type JsonRecord = Record<string, unknown>;

const jsonField = (obj: unknown, ...keys: string[]): unknown => {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  const rec = obj as JsonRecord;
  for (const k of keys) {
    if (k in rec && rec[k] != null) {
      return rec[k];
    }
  }
  return undefined;
};

const jsonStr = (obj: unknown, ...keys: string[]): string | undefined => {
  const v = jsonField(obj, ...keys);
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
};

const jsonNum = (obj: unknown, ...keys: string[]): number | undefined => {
  const v = jsonField(obj, ...keys);
  return typeof v === 'number' && !Number.isNaN(v) ? v : undefined;
};

const wireValueToDisplayString = (value: unknown): string => {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
};

const humanizeConditionType = (type: unknown): string => {
  const s = wireValueToDisplayString(type);
  return (
    s
      .replace(/^COMPUTE_INSTANCE_CONDITION_TYPE_/i, '')
      .replace(/^CONDITION_TYPE_/i, '')
      .replace(/_/g, ' ') || s
  );
};

const formatConditionStatusForDisplay = (wireStatus: unknown): string => {
  const wireStatusStr = wireValueToDisplayString(wireStatus);
  const u = wireStatusStr.toUpperCase();
  if (u.includes('TRUE') && !u.includes('FALSE')) {
    return 'True';
  }
  if (u.includes('FALSE')) {
    return 'False';
  }
  if (u === '' || u === 'UNKNOWN') {
    return 'Unknown';
  }
  const stripped = wireStatusStr.replace(/^CONDITION_STATUS_/i, '').replace(/_/g, ' ');
  return stripped ? stripped.charAt(0).toUpperCase() + stripped.slice(1).toLowerCase() : 'Unknown';
};

const shortSubnetDisplay = (subnet: string | undefined): string => {
  if (!subnet?.trim()) {
    return '—';
  }
  const s = subnet.trim();
  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  if (uuidLike) {
    return `${s.slice(0, 8)}…`;
  }
  return s;
};

const formatIsoDate = (iso?: string): string => {
  if (!iso?.trim()) {
    return '—';
  }
  const t = Date.parse(iso.trim());
  return Number.isNaN(t) ? iso : new Date(t).toLocaleString();
};

const readSubnet = (vm: ComputeInstance): string | undefined => {
  const attachments = jsonField(vm.spec, 'network_attachments', 'networkAttachments');
  if (Array.isArray(attachments) && attachments[0] && typeof attachments[0] === 'object') {
    const subnet = jsonStr(attachments[0], 'subnet');
    if (subnet) {
      return subnet;
    }
  }
  return jsonStr(vm.spec, 'subnet');
};

const readSecurityGroups = (vm: ComputeInstance): string[] | undefined => {
  const attachments = jsonField(vm.spec, 'network_attachments', 'networkAttachments');
  if (Array.isArray(attachments) && attachments[0] && typeof attachments[0] === 'object') {
    const sgs = jsonField(attachments[0], 'security_groups', 'securityGroups');
    if (Array.isArray(sgs) && sgs.every((x) => typeof x === 'string')) {
      return sgs;
    }
  }
  const top = jsonField(vm.spec, 'security_groups', 'securityGroups');
  if (Array.isArray(top) && top.every((x) => typeof x === 'string')) {
    return top;
  }
  return undefined;
};

const readIpAddress = (vm: ComputeInstance): string | undefined => {
  return (
    jsonStr(vm.status, 'public_ip_address', 'publicIpAddress') ??
    jsonStr(vm.status, 'internal_ip_address', 'internalIpAddress', 'ipAddress')
  );
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

  const description = jsonStr(vm, 'description');
  const memoryGib = jsonNum(vm.spec, 'memory_gib', 'memoryGib');
  const cores = jsonNum(vm.spec, 'cores');
  const runStrategy = jsonStr(vm.spec, 'run_strategy', 'runStrategy');
  const template = jsonStr(vm.spec, 'template');
  const createdAt = jsonStr(vm.metadata, 'creation_timestamp', 'createdAt');
  const tenant = jsonStr(vm.metadata, 'tenant');
  const creator = jsonStr(vm.metadata, 'creator');
  const tenantsLine = tenant ?? '—';
  const creatorsLine = creator ?? '—';
  const ipAddress = readIpAddress(vm);
  const subnet = readSubnet(vm);
  const securityGroups = readSecurityGroups(vm);
  const conditions = vm.status?.conditions ?? [];

  return (
    <Stack hasGutter>
      <StackItem>
        <Breadcrumb>
          <BreadcrumbItem>
            <Button variant="link" isInline onClick={() => navigate('/vms')}>
              Virtual machines
            </Button>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{vm.metadata?.name ?? vm.id}</BreadcrumbItem>
        </Breadcrumb>
      </StackItem>

      <StackItem>
        <Stack hasGutter={false}>
          <StackItem>
            <Title headingLevel="h1" size="2xl">
              {vm.metadata?.name ?? vm.id}
            </Title>
          </StackItem>
          {description && (
            <StackItem>
              <Content component="p" className="osac-vm-detail__description">
                {description}
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
                        <DescriptionListDescription>
                          {vm.metadata?.name ?? '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Template</DescriptionListTerm>
                        <DescriptionListDescription>{template ?? '—'}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Run strategy</DescriptionListTerm>
                        <DescriptionListDescription>
                          {runStrategy ?? '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>vCPU</DescriptionListTerm>
                        <DescriptionListDescription>{cores ?? '—'}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Memory</DescriptionListTerm>
                        <DescriptionListDescription>
                          {memoryGib != null ? `${memoryGib} GiB` : '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      {description && (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Description</DescriptionListTerm>
                          <DescriptionListDescription>{description}</DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                      <DescriptionListGroup>
                        <DescriptionListTerm>Created</DescriptionListTerm>
                        <DescriptionListDescription>
                          {createdAt ? formatIsoDate(createdAt) : '—'}
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
                          {vm.metadata?.version != null ? String(vm.metadata.version) : '—'}
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
                        <DescriptionListDescription>{ipAddress ?? '—'}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Subnet</DescriptionListTerm>
                        <DescriptionListDescription>
                          {shortSubnetDisplay(subnet)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Security groups</DescriptionListTerm>
                        <DescriptionListDescription>
                          {securityGroups?.join(', ') ?? '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </PageSection>
                </Tab>

                <Tab eventKey={2} title={<TabTitleText>Conditions</TabTitleText>}>
                  <PageSection hasBodyWrapper={false} className="osac-vm-detail__tab-panel">
                    {conditions.length > 0 ? (
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
                          {conditions.map((c, i) => (
                            <Tr key={`${String(c.type)}-${i}`}>
                              <Td dataLabel="Type">{humanizeConditionType(c.type)}</Td>
                              <Td dataLabel="Status">
                                {formatConditionStatusForDisplay(c.status)}
                              </Td>
                              <Td dataLabel="Reason">{jsonStr(c, 'reason') ?? '—'}</Td>
                              <Td dataLabel="Message">{jsonStr(c, 'message') ?? '—'}</Td>
                              <Td dataLabel="Last transition">
                                {formatIsoDate(
                                  jsonStr(c, 'last_transition_time', 'lastTransitionTime'),
                                )}
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
                    <strong>IP address:</strong> {ipAddress ?? '—'}
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
