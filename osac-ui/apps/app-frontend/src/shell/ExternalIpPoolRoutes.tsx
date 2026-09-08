import { Route, Routes } from 'react-router-dom';

import { ExternalIpPoolDetailsPage } from '@osac/ui-components/pages/admin/ExternalIpPoolDetailsPage';
import { ExternalIpPoolWizardPage } from '@osac/ui-components/pages/admin/ExternalIpPoolWizardPage';
import { ExternalIpPoolsListPage } from '@osac/ui-components/pages/admin/ExternalIpPoolsListPage';

export const ExternalIpPoolRoutes = () => (
  <Routes>
    <Route index element={<ExternalIpPoolsListPage />} />
    <Route path="create" element={<ExternalIpPoolWizardPage />} />
    <Route path=":id" element={<ExternalIpPoolDetailsPage />} />
  </Routes>
);
