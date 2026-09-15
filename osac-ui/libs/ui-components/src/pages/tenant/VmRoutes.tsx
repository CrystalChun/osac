import { Navigate, Route, Routes } from 'react-router-dom';

import { VmDetailsPage } from '@osac/ui-components/components/vm/VmDetailsPage';
import { useSession } from '@osac/ui-components/hooks/use-session';

import { VmCreatePage } from './VmCreatePage';
import { VmListPage } from './VmListPage';

/** Redirects cloud-provider-admin users away from tenant-only creation routes. */
const VmCreateGuard = () => {
  const { role } = useSession();

  if (role === 'admin') {
    return <Navigate to="/vms" replace />;
  }

  return <VmCreatePage />;
};

export const VmRoutes = () => (
  <Routes>
    <Route index element={<VmListPage />} />
    <Route path="create/:catalogItemId?" element={<VmCreateGuard />} />
    <Route path=":id" element={<VmDetailsPage />} />
  </Routes>
);
