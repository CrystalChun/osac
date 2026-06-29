/**
 * flow: cluster-service-catalog
 * step: csc_cluster_detail
 */
import { useState } from 'react';
import {
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

import { ClusterConditionsTab } from './ClusterConditionsTab';
import ClusterDetailsActionButtons from './ClusterDetailsActionButtons';
import { ClusterOverviewTab } from './ClusterOverviewTab';
import { ResourceDetailHeader } from '../../Resource/ResourceDetailHeader';

interface ClusterDetailViewProps {
  cluster: Cluster;
}

const tabContentId = (key: number): string => `cluster-tab-content-${key}`;

const ClusterDetailsPageContent = ({ cluster }: ClusterDetailViewProps) => {
  const [activeTabKey, setActiveTabKey] = useState(0);

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <StackItem>
            <ResourceDetailHeader
              parentTo="/clusters"
              parentLabel="Clusters"
              resourceName={cluster.metadata?.name ?? cluster.id}
            />
          </StackItem>
          <StackItem>
            <ClusterDetailsActionButtons cluster={cluster} />
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
                tabContentId={tabContentId(0)}
              />
              <Tab
                eventKey={1}
                title={<TabTitleText>Conditions</TabTitleText>}
                tabContentId={tabContentId(1)}
              />
            </Tabs>
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <TabContent
          eventKey={0}
          id={tabContentId(0)}
          activeKey={activeTabKey}
          hidden={0 !== activeTabKey}
        >
          <TabContentBody>
            <ClusterOverviewTab cluster={cluster} />
          </TabContentBody>
        </TabContent>
        <TabContent
          eventKey={1}
          id={tabContentId(1)}
          activeKey={activeTabKey}
          hidden={1 !== activeTabKey}
        >
          <TabContentBody>
            <ClusterConditionsTab cluster={cluster} />
          </TabContentBody>
        </TabContent>
      </PageSection>
    </>
  );
};

export default ClusterDetailsPageContent;
