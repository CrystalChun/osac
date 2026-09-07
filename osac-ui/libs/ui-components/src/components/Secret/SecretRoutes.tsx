import { Route, Routes } from 'react-router-dom';

import SecretListPage from './SecretListPage';

const SecretRoutes = () => {
  return (
    <Routes>
      <Route index element={<SecretListPage />} />
    </Routes>
  );
};

export default SecretRoutes;
