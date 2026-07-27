import { useState } from 'react';
import { Tab, TabTitleText, Tabs } from '@patternfly/react-core';

import { type PublicationFilter } from '@osac/ui-components/components/catalog/catalogItemDisplay';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import { useSession } from '@osac/ui-components/hooks/use-session';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import BareMetalInstanceCatalogManagementPanel from './BareMetalInstanceCatalogManagementPanel';
import ClusterCatalogManagementPanel from './ClusterCatalogManagementPanel';
import ComputeInstanceCatalogManagementPanel from './ComputeInstanceCatalogManagementPanel';

type CatalogManagementTabKey = 'cluster' | 'compute-instance' | 'baremetal-instance';

const CatalogManagementListPage = () => {
  const { t } = useTranslation();
  const { role } = useSession();
  const [activeTab, setActiveTab] = useState<CatalogManagementTabKey>('cluster');
  const [search, setSearch] = useState('');
  const [publicationFilter, setPublicationFilter] = useState<PublicationFilter>('all');

  const sharedPanelProps = { search, setSearch, publicationFilter, setPublicationFilter, role };

  return (
    <ListPage title={t('Catalog management')}>
      <Tabs
        activeKey={activeTab}
        onSelect={(_event, eventKey) => setActiveTab(eventKey as CatalogManagementTabKey)}
        aria-label={t('Catalog management resource type tabs')}
      >
        <Tab eventKey="cluster" title={<TabTitleText>{t('Clusters')}</TabTitleText>}>
          <ClusterCatalogManagementPanel isActive={activeTab === 'cluster'} {...sharedPanelProps} />
        </Tab>
        <Tab
          eventKey="compute-instance"
          title={<TabTitleText>{t('Virtual Machines')}</TabTitleText>}
        >
          <ComputeInstanceCatalogManagementPanel
            isActive={activeTab === 'compute-instance'}
            {...sharedPanelProps}
          />
        </Tab>
        <Tab eventKey="baremetal-instance" title={<TabTitleText>{t('Bare Metal')}</TabTitleText>}>
          <BareMetalInstanceCatalogManagementPanel
            isActive={activeTab === 'baremetal-instance'}
            {...sharedPanelProps}
          />
        </Tab>
      </Tabs>
    </ListPage>
  );
};

export default CatalogManagementListPage;
