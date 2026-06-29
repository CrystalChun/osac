/**
 * flow: cluster-service-catalog
 * step: csc_cluster_detail
 */
import { useState } from 'react';
import {
  Divider,
  Flex,
  FlexItem,
  PageSection,
  Stack,
  StackItem,
  Tab,
  TabContent,
  TabContentBody,
  TabTitleText,
  Tabs,
} from '@patternfly/react-core';

import type { Cluster } from '@osac/types';

import ClusterDetailsActionButtons from './ClusterDetailsActionButtons';
import { ClusterDetailsSummary } from './ClusterDetailsSummary';
import { ClusterNetworkingTab } from './ClusterNetworkingTab';
import { ClusterOverviewTab } from './ClusterOverviewTab';
import { ResourceDetailHeader } from '../../Resource/ResourceDetailHeader';
import { ClusterStatusLabel } from '../ClusterStatusLabel';

interface ClusterDetailViewProps {
  cluster: Cluster;
}

const CLUSTER_DETAIL_OVERVIEW_TAB_ID = 'cluster-detail-overview';
const CLUSTER_DETAIL_NETWORKING_TAB_ID = 'cluster-detail-networking';

const ClusterDetailsPageContent = ({ cluster }: ClusterDetailViewProps) => {
  const [activeTabKey, setActiveTabKey] = useState(0);

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
                  parentTo="/clusters"
                  parentLabel="Clusters"
                  resourceName={cluster.metadata?.name ?? cluster.id}
                  titleAddon={<ClusterStatusLabel state={cluster.status?.state} />}
                />
              </FlexItem>
              <FlexItem>
                <ClusterDetailsActionButtons cluster={cluster} />
              </FlexItem>
            </Flex>
          </StackItem>
          <StackItem>
            <ClusterDetailsSummary cluster={cluster} />
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
          <StackItem>
            <Tabs
              activeKey={activeTabKey}
              onSelect={(_event, tabIndex) => setActiveTabKey(Number(tabIndex))}
              id="cluster-detail-tabs"
            >
              <Tab
                eventKey={0}
                title={<TabTitleText>Overview</TabTitleText>}
                tabContentId={CLUSTER_DETAIL_OVERVIEW_TAB_ID}
              />
              <Tab
                eventKey={1}
                title={<TabTitleText>Networking</TabTitleText>}
                tabContentId={CLUSTER_DETAIL_NETWORKING_TAB_ID}
              />
            </Tabs>
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <TabContent
          eventKey={0}
          id={CLUSTER_DETAIL_OVERVIEW_TAB_ID}
          activeKey={activeTabKey}
          hidden={0 !== activeTabKey}
        >
          <TabContentBody>
            <ClusterOverviewTab cluster={cluster} />
          </TabContentBody>
        </TabContent>
        <TabContent
          eventKey={1}
          id={CLUSTER_DETAIL_NETWORKING_TAB_ID}
          activeKey={activeTabKey}
          hidden={1 !== activeTabKey}
        >
          <TabContentBody>
            <ClusterNetworkingTab cluster={cluster} />
          </TabContentBody>
        </TabContent>
      </PageSection>
    </>
  );
};

export default ClusterDetailsPageContent;
