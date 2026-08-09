import { Navigate, Route, Routes } from 'react-router-dom';

import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import { StorageManagementPage } from '@osac/ui-components/pages/admin/StorageManagementPage';
import { StoragePlaceholder } from '@osac/ui-components/pages/admin/StoragePlaceholder';

export const StorageRoutes = () => {
  const { t } = useTranslation();

  return (
    <Routes>
      <Route index element={<Navigate to="backends" replace />} />
      <Route path="backends" element={<StorageManagementPage activeTab="backends" />} />
      <Route
        path="backends/create"
        element={<StoragePlaceholder title={t('Create storage backend')} />}
      />
      <Route
        path="backends/:id/edit"
        element={<StoragePlaceholder title={t('Edit storage backend')} />}
      />
      <Route path="tiers" element={<StorageManagementPage activeTab="tiers" />} />
      <Route
        path="tiers/create"
        element={<StoragePlaceholder title={t('Create storage tier')} />}
      />
      <Route
        path="tiers/:id/edit"
        element={<StoragePlaceholder title={t('Edit storage tier')} />}
      />
    </Routes>
  );
};
