import { Route, Routes } from 'react-router-dom';

import ListPage from '@osac/ui-components/components/Page/ListPage';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

export const AdminCatalogRoutes = () => {
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
      <Route path=":type/create" element={<div />} />
      <Route path=":type/:id" element={<div />} />
      <Route path=":type/:id/edit" element={<div />} />
    </Routes>
  );
};
