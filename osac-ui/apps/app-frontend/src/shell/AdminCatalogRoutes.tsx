import { Route, Routes } from 'react-router-dom';

import CatalogManagementListPage from '@osac/ui-components/pages/admin/CatalogManagementListPage';

export const AdminCatalogRoutes = () => {
  return (
    <Routes>
      <Route index element={<CatalogManagementListPage />} />
      <Route path=":type/create" element={<div />} />
      <Route path=":type/:id" element={<div />} />
      <Route path=":type/:id/edit" element={<div />} />
    </Routes>
  );
};
