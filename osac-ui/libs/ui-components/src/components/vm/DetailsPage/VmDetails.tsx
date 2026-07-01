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

import type { ComputeInstance } from '@osac/types';

import VmDetailsActionButtons from './VmDetailsActionButtons';
import VmDetailsOverviewTab from './VmDetailsOverviewTab';
import VmDetailsSummary from './VmDetailsSummary';
import VmNetworkingTab from './VmNetworkingTab';
import { useTranslation } from '../../../hooks/useTranslation';
import { VmStatusLabel } from '../../../VmStatusLabel';
import { ResourceDetailHeader } from '../../Resource/ResourceDetailHeader';

interface Props {
  vm: ComputeInstance;
}

const VM_DETAIL_OVERVIEW_TAB_ID = 'vm-detail-overview';
const VM_DETAIL_NETWORKING_TAB_ID = 'vm-detail-networking';

const VmDetails = ({ vm }: Props) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

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
                  parentLabel={t('vm.details.breadcrumb')}
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
                title={<TabTitleText>{t('Overview')}</TabTitleText>}
                tabContentId={VM_DETAIL_OVERVIEW_TAB_ID}
              />
              <Tab
                eventKey={1}
                title={<TabTitleText>{t('Networking')}</TabTitleText>}
                tabContentId={VM_DETAIL_NETWORKING_TAB_ID}
              />
            </Tabs>
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <TabContent
          eventKey={0}
          id={VM_DETAIL_OVERVIEW_TAB_ID}
          activeKey={activeTab}
          hidden={activeTab !== 0}
        >
          <TabContentBody>
            <VmDetailsOverviewTab vm={vm} />
          </TabContentBody>
        </TabContent>
        <TabContent
          eventKey={1}
          id={VM_DETAIL_NETWORKING_TAB_ID}
          activeKey={activeTab}
          hidden={activeTab !== 1}
        >
          <TabContentBody>
            <VmNetworkingTab vm={vm} />
          </TabContentBody>
        </TabContent>
      </PageSection>
    </>
  );
};

export default VmDetails;
