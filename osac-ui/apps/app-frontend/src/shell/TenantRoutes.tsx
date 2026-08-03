import { Route, Routes } from 'react-router-dom';

import { TenantListPage } from '@osac/ui-components/pages/admin/TenantListPage';

export const TenantRoutes = () => (
  <Routes>
    <Route index element={<TenantListPage />} />
  </Routes>
);
