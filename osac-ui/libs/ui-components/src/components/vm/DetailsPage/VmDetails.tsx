import { useState } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  PageSection,
  Stack,
  StackItem,
  Tab,
  TabContent,
  TabContentBody,
  TabTitleText,
  Tabs,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ComputeInstance } from '@osac/types';

import { VmDetailsActionButtons } from './VmDetailsActionButtons';
import { VmDetailsCatalogValue } from './VmDetailsCatalogValue';
import { VmDetailsSummary } from './VmDetailsSummary';
import { displayValue } from '../../../utils/detailFormatters';
import { VmStatusLabel } from '../../../VmStatusLabel';
import { Timestamp } from '../../Primitives/Timestamp';
import { ResourceConditionsTable } from '../../Resource/ResourceConditionsTable';
import { ResourceDetailHeader } from '../../Resource/ResourceDetailHeader';
import { SubtleContent } from '../../SubtleContent/SubtleContent';

interface Props {
  vm: ComputeInstance;
}

const virtualNetworkLabel = (index: number, total: number): string => {
  if (total === 1) {
    return 'Virtual network';
  }
  return `Virtual network ${index + 1}`;
};

const VM_DETAIL_OVERVIEW_TAB_ID = 'vm-detail-overview';
const VM_DETAIL_NETWORKING_TAB_ID = 'vm-detail-networking';

export const VmDetails = ({ vm }: Props) => {
  const [activeTab, setActiveTab] = useState(0);

  const runStrategy = vm.spec?.runStrategy;
  const catalogItem = vm.spec?.catalogItem;
  const tenant = vm.metadata?.tenant;
  const creator = vm.metadata?.creator;
  const networkAttachments = vm.spec?.networkAttachments ?? [];
  const conditions = vm.status?.conditions ?? [];

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <StackItem>
            <Flex
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
              alignItems={{ default: 'alignItemsFlexStart' }}
              flexWrap={{ default: 'wrap' }}
              spaceItems={{ default: 'spaceItemsMd' }}
            >
              <FlexItem>
                <ResourceDetailHeader
                  parentTo="/vms"
                  parentLabel="Virtual machines"
                  resourceName={vm.metadata?.name ?? vm.id}
                  titleAddon={<VmStatusLabel state={vm.status?.state} />}
                />
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
            <Tabs
              id="vm-detail-tabs"
              activeKey={activeTab}
              onSelect={(_e, key) => setActiveTab(Number(key))}
            >
              <Tab
                eventKey={0}
                title={<TabTitleText>Overview</TabTitleText>}
                tabContentId={VM_DETAIL_OVERVIEW_TAB_ID}
              />
              <Tab
                eventKey={1}
                title={<TabTitleText>Networking</TabTitleText>}
                tabContentId={VM_DETAIL_NETWORKING_TAB_ID}
              />
            </Tabs>
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Grid hasGutter>
          <GridItem md={6}>
            <TabContent
              eventKey={0}
              id={VM_DETAIL_OVERVIEW_TAB_ID}
              activeKey={activeTab}
              hidden={activeTab !== 0}
            >
              <TabContentBody>
                <Card isFullHeight>
                  <CardTitle>Overview</CardTitle>
                  <CardBody>
                    <DescriptionList isHorizontal isCompact>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Name</DescriptionListTerm>
                        <DescriptionListDescription>
                          {displayValue(vm.metadata?.name)}
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
                          {displayValue(runStrategy)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Created</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Timestamp value={vm.metadata?.creationTimestamp} />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Tenants</DescriptionListTerm>
                        <DescriptionListDescription>
                          {displayValue(tenant)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Creators</DescriptionListTerm>
                        <DescriptionListDescription>
                          {displayValue(creator)}
                        </DescriptionListDescription>
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
              </TabContentBody>
            </TabContent>
            <TabContent
              eventKey={1}
              id={VM_DETAIL_NETWORKING_TAB_ID}
              activeKey={activeTab}
              hidden={activeTab !== 1}
            >
              <TabContentBody>
                <Card isFullHeight>
                  <CardTitle>Networking</CardTitle>
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
                              <Td dataLabel="Subnet">{displayValue(attachment.subnet)}</Td>
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
              </TabContentBody>
            </TabContent>
          </GridItem>

          <GridItem md={6}>
            <Card isFullHeight>
              <CardTitle>Conditions</CardTitle>
              <CardBody>
                <ResourceConditionsTable
                  ariaLabel="Virtual machine conditions"
                  conditions={conditions}
                  conditionResourceKind="compute_instance"
                />
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};
