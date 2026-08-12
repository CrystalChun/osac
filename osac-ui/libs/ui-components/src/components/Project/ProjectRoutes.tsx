import { Route, Routes } from 'react-router-dom';

import ProjectCreatePage from '@osac/ui-components/components/Project/CreatePage/ProjectCreatePage';
import ProjectListPage from '@osac/ui-components/components/Project/ProjectListPage';

const ProjectRoutes = () => (
  <Routes>
    <Route index element={<ProjectListPage />} />
    <Route path="create" element={<ProjectCreatePage />} />
  </Routes>
);

export default ProjectRoutes;
