import { Route, Routes } from 'react-router-dom';

import { BareMetalDetailsPage } from './BareMetalDetailsPage';
import { BareMetalListPage } from './BareMetalListPage';

export const BareMetalRoutes = () => (
  <Routes>
    <Route index element={<BareMetalListPage />} />
    <Route path=":id" element={<BareMetalDetailsPage />} />
  </Routes>
);
