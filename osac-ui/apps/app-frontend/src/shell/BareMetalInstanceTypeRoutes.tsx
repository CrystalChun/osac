import { Route, Routes } from 'react-router-dom';

import AdminBareMetalInstanceTypeListPage from '@osac/ui-components/components/BareMetalInstanceType/AdminBareMetalInstanceTypeListPage';

export const BareMetalInstanceTypeRoutes = () => (
  <Routes>
    <Route index element={<AdminBareMetalInstanceTypeListPage />} />
  </Routes>
);
