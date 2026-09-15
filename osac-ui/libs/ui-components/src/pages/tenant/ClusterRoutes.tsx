import { Navigate, Route, Routes } from 'react-router-dom';

import { ClusterDetailsPage } from '@osac/ui-components/components/Cluster/ClusterDetailsPage';
import { ClustersPage } from '@osac/ui-components/components/Cluster/ClustersPage';
import { useSession } from '@osac/ui-components/hooks/use-session';

import { ClusterCreatePage } from './ClusterCreatePage';

/** Redirects cloud-provider-admin users away from tenant-only creation routes. */
const ClusterCreateGuard = () => {
  const { role } = useSession();

  if (role === 'admin') {
    return <Navigate to="/clusters" replace />;
  }

  return <ClusterCreatePage />;
};

export const ClusterRoutes = () => {
  return (
    <Routes>
      <Route index element={<ClustersPage />} />
      <Route path="create/:catalogItemId?" element={<ClusterCreateGuard />} />
      <Route path=":clusterId" element={<ClusterDetailsPage />} />
    </Routes>
  );
};
