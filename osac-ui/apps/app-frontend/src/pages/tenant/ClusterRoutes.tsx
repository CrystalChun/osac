import { Route, Routes } from 'react-router-dom';

import { ClusterDetailsPage } from './ClusterDetailsPage';
import { ClustersPage } from './ClustersPage';

export const ClusterRoutes = () => {
  return (
    <Routes>
      <Route index element={<ClustersPage />} />
      <Route path=":clusterId" element={<ClusterDetailsPage />} />
    </Routes>
  );
};
