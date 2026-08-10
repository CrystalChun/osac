import { Route, Routes } from 'react-router-dom';

import AdminInstanceTypeCreatePage from '@osac/ui-components/components/InstanceType/AdminInstanceTypeCreatePage';
import AdminInstanceTypeListPage from '@osac/ui-components/components/InstanceType/AdminInstanceTypeListPage';

export const InstanceTypeRoutes = () => (
  <Routes>
    <Route index element={<AdminInstanceTypeListPage />} />
    <Route path="create" element={<AdminInstanceTypeCreatePage />} />
  </Routes>
);
