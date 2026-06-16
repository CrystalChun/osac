import { Route, Routes } from 'react-router-dom';

import { ClusterDetailPage } from './ClusterDetailPage';
import { ClustersPage } from './ClustersPage';

export const ClusterRoutes = () => {
  return (
    <Routes>
      <Route index element={<ClustersPage />} />
      <Route path=":clusterId" element={<ClusterDetailPage />} />
    </Routes>
  );
};
