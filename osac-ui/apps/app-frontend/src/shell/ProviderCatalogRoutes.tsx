import { Route, Routes } from 'react-router-dom';
import { PageSection } from '@patternfly/react-core';

import ListPage from '@osac/ui-components/components/Page/ListPage';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

const Placeholder = () => {
  const { t } = useTranslation();
  return <PageSection>{t('Coming soon')}</PageSection>;
};

export const ProviderCatalogRoutes = () => {
  const { t } = useTranslation();

  return (
    <Routes>
      <Route
        index
        element={
          <ListPage title={t('Catalog management')}>
            <div />
          </ListPage>
        }
      />
      <Route path=":type/create" element={<Placeholder />} />
      <Route path=":type/:id" element={<Placeholder />} />
      <Route path=":type/:id/edit" element={<Placeholder />} />
    </Routes>
  );
};
