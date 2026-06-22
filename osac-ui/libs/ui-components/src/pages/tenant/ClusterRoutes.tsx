import { Route, Routes } from 'react-router-dom';

import { ClusterDetailsPage } from '@osac/ui-components/components/Cluster/ClusterDetailsPage';
import { ClustersPage } from '@osac/ui-components/components/Cluster/ClustersPage';

export const ClusterRoutes = () => {
  return (
    <Routes>
      <Route index element={<ClustersPage />} />
      <Route path=":clusterId" element={<ClusterDetailsPage />} />
    </Routes>
  );
};
