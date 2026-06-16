/**
 * flow: cluster-service-catalog
 * step: csc_cluster_detail
 */
import { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  PageSection,
  Stack,
  StackItem,
  Tab,
  TabTitleText,
  Tabs,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { Cluster } from '@osac/types';
import { ExternalLink } from '@osac/ui-components/ExternalLink';
import { Timestamp } from '@osac/ui-components/Timestamp';

import { ClusterStatusLabel } from './ClusterStatusLabel';
import { ResourceConditionsTable } from '../resource/ResourceConditionsTable';
import { ResourceDetailHeader } from '../resource/ResourceDetailHeader';

import '../resource/resourceDetailLayout.css';

interface ClusterDetailViewProps {
  cluster: Cluster;
}

const displayValue = (value?: string): string => value ?? '—';

export const ClusterDetailView = ({ cluster }: ClusterDetailViewProps) => {
  const [activeTab, setActiveTab] = useState(0);

  const name = cluster.metadata?.name || cluster.id;
  const apiUrl = cluster.status?.apiUrl;
  const consoleUrl = cluster.status?.consoleUrl;
  const network = cluster.spec?.network;
  const nodeSetEntries = Object.entries(cluster.spec?.nodeSets ?? {});
  const conditions = cluster.status?.conditions ?? [];

  return (
    <Stack hasGutter>
      <ResourceDetailHeader parentTo="/clusters" parentLabel="Clusters" resourceName={name} />

      <StackItem>
        <div className="osac-resource-detail-layout">
          <Card isFullHeight className="osac-resource-detail-main-card">
            <CardBody>
              <Tabs
                activeKey={activeTab}
                onSelect={(_e, key) => setActiveTab(Number(key))}
                className="osac-resource-detail-tabs"
              >
                <Tab eventKey={0} title={<TabTitleText>Overview</TabTitleText>}>
                  <PageSection hasBodyWrapper={false} className="osac-resource-detail__tab-panel">
                    <DescriptionList isCompact>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Name</DescriptionListTerm>
                        <DescriptionListDescription>{name}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>ID</DescriptionListTerm>
                        <DescriptionListDescription>{cluster.id}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Catalog item</DescriptionListTerm>
                        <DescriptionListDescription>
                          {displayValue(cluster.spec?.catalogItem)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Release image</DescriptionListTerm>
                        <DescriptionListDescription>
                          {displayValue(cluster.spec?.releaseImage)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Created</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Timestamp value={cluster.metadata?.creationTimestamp} />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Creator</DescriptionListTerm>
                        <DescriptionListDescription>
                          {displayValue(cluster.metadata?.creator)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>

                    {nodeSetEntries.length > 0 ? (
                      <>
                        <Content component="h3">Node sets</Content>
                        <Table aria-label="Cluster node sets" variant="compact">
                          <Thead>
                            <Tr>
                              <Th>Name</Th>
                              <Th>Host type</Th>
                              <Th>Size</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {nodeSetEntries.map(([key, nodeSet]) => (
                              <Tr key={key}>
                                <Td dataLabel="Name">{key}</Td>
                                <Td dataLabel="Host type">{displayValue(nodeSet.hostType)}</Td>
                                <Td dataLabel="Size">{nodeSet.size}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </>
                    ) : (
                      <Content component="p" className="osac-resource-detail__empty-state">
                        No node sets configured.
                      </Content>
                    )}
                  </PageSection>
                </Tab>

                <Tab eventKey={1} title={<TabTitleText>Networking</TabTitleText>}>
                  <PageSection hasBodyWrapper={false} className="osac-resource-detail__tab-panel">
                    <DescriptionList isCompact>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Pod CIDR</DescriptionListTerm>
                        <DescriptionListDescription>
                          {displayValue(network?.podCidr)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Service CIDR</DescriptionListTerm>
                        <DescriptionListDescription>
                          {displayValue(network?.serviceCidr)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </PageSection>
                </Tab>

                <Tab eventKey={2} title={<TabTitleText>Conditions</TabTitleText>}>
                  <PageSection hasBodyWrapper={false} className="osac-resource-detail__tab-panel">
                    <ResourceConditionsTable
                      ariaLabel="Cluster conditions"
                      conditions={conditions}
                    />
                  </PageSection>
                </Tab>
              </Tabs>
            </CardBody>
          </Card>

          <Card isFullHeight className="osac-resource-detail-side-card">
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardBody>
              <Stack hasGutter>
                <StackItem>
                  <ClusterStatusLabel state={cluster.status?.state} />
                </StackItem>
                <StackItem>
                  <Content component="p" className="osac-resource-detail-side__summary-line">
                    <strong>API URL:</strong> <ExternalLink href={apiUrl} />
                  </Content>
                </StackItem>
                <StackItem>
                  <Content component="p" className="osac-resource-detail-side__summary-line">
                    <strong>Console URL:</strong> <ExternalLink href={consoleUrl} />
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
