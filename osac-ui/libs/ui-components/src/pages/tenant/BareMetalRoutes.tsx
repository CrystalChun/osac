import { Navigate, Route, Routes } from 'react-router-dom';

import { useSession } from '@osac/ui-components/hooks/use-session';

import { BareMetalCreatePage } from './BareMetalCreatePage';
import { BareMetalDetailsPage } from './BareMetalDetailsPage';
import { BareMetalListPage } from './BareMetalListPage';

/** Redirects cloud-provider-admin users away from tenant-only creation routes. */
const BareMetalCreateGuard = () => {
  const { role } = useSession();

  if (role === 'admin') {
    return <Navigate to="/bare-metal" replace />;
  }

  return <BareMetalCreatePage />;
};

export const BareMetalRoutes = () => (
  <Routes>
    <Route index element={<BareMetalListPage />} />
    <Route path="create" element={<BareMetalCreateGuard />} />
    <Route path="create/:catalogItemId" element={<BareMetalCreateGuard />} />
    <Route path=":id" element={<BareMetalDetailsPage />} />
  </Routes>
);
