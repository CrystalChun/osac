import { Route, Routes } from 'react-router-dom';

import { ExternalIpPoolDetailsPage } from '@osac/ui-components/pages/admin/ExternalIpPoolDetailsPage';
import { ExternalIpPoolFormPage } from '@osac/ui-components/pages/admin/ExternalIpPoolFormPage';
import { ExternalIpPoolsListPage } from '@osac/ui-components/pages/admin/ExternalIpPoolsListPage';

export const ExternalIpPoolRoutes = () => (
  <Routes>
    <Route index element={<ExternalIpPoolsListPage />} />
    <Route path="create" element={<ExternalIpPoolFormPage />} />
    <Route path=":id" element={<ExternalIpPoolDetailsPage />} />
    <Route path=":id/edit" element={<ExternalIpPoolFormPage />} />
  </Routes>
);
