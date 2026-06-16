import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Stack,
  StackItem,
  Tab,
  TabTitleText,
  Tabs,
  Title,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ComputeInstance } from '@osac/types';

import { VmDetailsActionButtons } from './VmDetailsActionButtons';
import { VmDetailsCatalogValue } from './VmDetailsCatalogValue';
import { VmDetailsConditions } from './VmDetailsConditions';
import { VmDetailsSummary } from './VmDetailsSummary';
import { SubtleContent } from '../../SubtleContent/SubtleContent';

interface Props {
  vm: ComputeInstance;
}

type ProtobufTimestamp = NonNullable<NonNullable<ComputeInstance['metadata']>['creationTimestamp']>;

const formatTimestamp = (timestamp?: ProtobufTimestamp): string => {
  if (!timestamp?.seconds) {
    return '—';
  }
  const ms = Number(timestamp.seconds) * 1000 + Math.floor((timestamp.nanos ?? 0) / 1_000_000);
  return new Date(ms).toLocaleString();
};

const shortSubnetDisplay = (subnet?: string): string => {
  if (!subnet) {
    return '—';
  }
  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subnet);
  if (uuidLike) {
    return `${subnet.slice(0, 8)}…`;
  }
  return subnet;
};

const virtualNetworkLabel = (index: number, total: number): string => {
  if (total === 1) {
    return 'Virtual network';
  }
  return `Virtual network ${index + 1}`;
};

export const VmDetails = ({ vm }: Props) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const runStrategy = vm.spec?.runStrategy;
  const catalogItem = vm.spec?.catalogItem;
  const createdAt = formatTimestamp(vm.metadata?.creationTimestamp);
  const tenant = vm.metadata?.tenant;
  const creator = vm.metadata?.creator;
  const tenantsLine = tenant || '—';
  const creatorsLine = creator || '—';
  const networkAttachments = vm.spec?.networkAttachments ?? [];

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
        <Flex
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          alignItems={{ default: 'alignItemsFlexStart' }}
          flexWrap={{ default: 'wrap' }}
          spaceItems={{ default: 'spaceItemsMd' }}
        >
          <FlexItem>
            <Title headingLevel="h1" size="2xl">
              {vm.metadata?.name ?? vm.id}
            </Title>
          </FlexItem>
          <FlexItem>
            <VmDetailsActionButtons vm={vm} />
          </FlexItem>
        </Flex>
      </StackItem>

      <StackItem>
        <VmDetailsSummary vm={vm} />
      </StackItem>

      <StackItem>
        <Divider />
      </StackItem>

      <StackItem>
        <Grid hasGutter>
          <GridItem md={8}>
            <Tabs activeKey={activeTab} onSelect={(_e, key) => setActiveTab(Number(key))}>
              <Tab eventKey={0} title={<TabTitleText>Overview</TabTitleText>}>
                <Card isFullHeight>
                  <CardBody>
                    <DescriptionList isHorizontal isCompact>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Name</DescriptionListTerm>
                        <DescriptionListDescription>
                          {vm.metadata?.name ?? '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Catalog</DescriptionListTerm>
                        <DescriptionListDescription>
                          <VmDetailsCatalogValue catalogItemId={catalogItem} />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Run strategy</DescriptionListTerm>
                        <DescriptionListDescription>
                          {runStrategy ?? '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Created</DescriptionListTerm>
                        <DescriptionListDescription>{createdAt}</DescriptionListDescription>
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
                  </CardBody>
                </Card>
              </Tab>

              <Tab eventKey={1} title={<TabTitleText>Networking</TabTitleText>}>
                <Card isFullHeight>
                  <CardBody>
                    {networkAttachments.length > 0 ? (
                      <Table
                        aria-label="Virtual machine network attachments"
                        variant="compact"
                        borders
                      >
                        <Thead>
                          <Tr>
                            <Th>Virtual network</Th>
                            <Th>Subnet</Th>
                            <Th>Security groups</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {networkAttachments.map((attachment, index) => (
                            <Tr key={`network-attachment-${index}`}>
                              <Td dataLabel="Virtual network">
                                {virtualNetworkLabel(index, networkAttachments.length)}
                              </Td>
                              <Td dataLabel="Subnet">{shortSubnetDisplay(attachment.subnet)}</Td>
                              <Td dataLabel="Security groups">
                                {attachment.securityGroups.length > 0
                                  ? attachment.securityGroups.join(', ')
                                  : '—'}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    ) : (
                      <SubtleContent component="p">No virtual networks configured.</SubtleContent>
                    )}
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>
          </GridItem>

          <GridItem md={4}>
            <VmDetailsConditions vm={vm} />
          </GridItem>
        </Grid>
      </StackItem>
    </Stack>
  );
};
