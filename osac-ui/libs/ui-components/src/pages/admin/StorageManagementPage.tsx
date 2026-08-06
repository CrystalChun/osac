import { useNavigate } from 'react-router-dom';
import { Tab, TabTitleText, Tabs } from '@patternfly/react-core';

import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import { StoragePlaceholder } from './StoragePlaceholder';

type StorageTab = 'backends' | 'tiers';

const isStorageTab = (value: string | number): value is StorageTab =>
  value === 'backends' || value === 'tiers';

export const StorageManagementPage = ({ activeTab }: { activeTab: StorageTab }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <ListPage title={t('Storage')}>
      <ListPageBody isLoading={false}>
        <Tabs
          activeKey={activeTab}
          onSelect={(_event, tabKey) => {
            if (isStorageTab(tabKey)) {
              navigate(`/admin/storage/${tabKey}`);
            }
          }}
          aria-label={t('Storage tabs')}
        >
          <Tab eventKey="backends" title={<TabTitleText>{t('Backends')}</TabTitleText>}>
            <StoragePlaceholder title={t('Storage backends')} />
          </Tab>
          <Tab eventKey="tiers" title={<TabTitleText>{t('Tiers')}</TabTitleText>}>
            <StoragePlaceholder title={t('Storage tiers')} />
          </Tab>
        </Tabs>
      </ListPageBody>
    </ListPage>
  );
};
