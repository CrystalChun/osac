import { useState } from 'react';
import { Tab, TabTitleText, Tabs } from '@patternfly/react-core';

import {
  useAdminBareMetalInstanceCatalogItems,
  useAdminSetBareMetalInstanceCatalogItemPublished,
} from '@osac/ui-components/api/v1/baremetal-instance';
import {
  useAdminClusterCatalogItems,
  useAdminSetClusterCatalogItemPublished,
} from '@osac/ui-components/api/v1/cluster-catalog-item';
import {
  useAdminComputeInstanceCatalogItems,
  useAdminSetComputeInstanceCatalogItemPublished,
} from '@osac/ui-components/api/v1/compute-instance-catalog-item';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import { useSession } from '@osac/ui-components/hooks/use-session';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import CatalogManagementTabPanel, {
  type CatalogManagementTabKey,
  type PublicationFilter,
} from './CatalogManagementTabPanel';

const CatalogManagementListPage = () => {
  const { t } = useTranslation();
  const { role } = useSession();
  const [activeTab, setActiveTab] = useState<CatalogManagementTabKey>('cluster');
  const [search, setSearch] = useState('');
  const [publicationFilter, setPublicationFilter] = useState<PublicationFilter>('all');

  const clusterItems = useAdminClusterCatalogItems(undefined, activeTab === 'cluster');
  const computeInstanceItems = useAdminComputeInstanceCatalogItems(
    undefined,
    activeTab === 'compute-instance',
  );
  const bareMetalItems = useAdminBareMetalInstanceCatalogItems(
    undefined,
    activeTab === 'baremetal-instance',
  );

  const setClusterPublished = useAdminSetClusterCatalogItemPublished();
  const setComputeInstancePublished = useAdminSetComputeInstanceCatalogItemPublished();
  const setBareMetalPublished = useAdminSetBareMetalInstanceCatalogItemPublished();

  const sharedPanelProps = { search, setSearch, publicationFilter, setPublicationFilter, role };

  return (
    <ListPage title={t('Catalog management')}>
      <Tabs
        activeKey={activeTab}
        onSelect={(_event, eventKey) => setActiveTab(eventKey as CatalogManagementTabKey)}
        aria-label={t('Catalog management resource type tabs')}
      >
        <Tab eventKey="cluster" title={<TabTitleText>{t('Clusters')}</TabTitleText>}>
          <CatalogManagementTabPanel
            tabKey="cluster"
            title={t('Clusters')}
            result={clusterItems}
            setPublished={setClusterPublished.mutate}
            {...sharedPanelProps}
          />
        </Tab>
        <Tab
          eventKey="compute-instance"
          title={<TabTitleText>{t('Virtual Machines')}</TabTitleText>}
        >
          <CatalogManagementTabPanel
            tabKey="compute-instance"
            title={t('Virtual Machines')}
            result={computeInstanceItems}
            setPublished={setComputeInstancePublished.mutate}
            {...sharedPanelProps}
          />
        </Tab>
        <Tab eventKey="baremetal-instance" title={<TabTitleText>{t('Bare Metal')}</TabTitleText>}>
          <CatalogManagementTabPanel
            tabKey="baremetal-instance"
            title={t('Bare Metal')}
            result={bareMetalItems}
            setPublished={setBareMetalPublished.mutate}
            {...sharedPanelProps}
          />
        </Tab>
      </Tabs>
    </ListPage>
  );
};

export default CatalogManagementListPage;
