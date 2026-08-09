import { useNavigate } from 'react-router-dom';
import { Button } from '@patternfly/react-core';

import AdminInstanceTypeTable from './AdminInstanceTypeTable';
import { useAdminInstanceTypes } from '../../api/v1/private/instance-type';
import { useTranslation } from '../../hooks/useTranslation';
import ListPage from '../Page/ListPage';
import ListPageBody from '../Page/ListPageBody';

const AdminInstanceTypeListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: instanceTypes = [], isLoading, error } = useAdminInstanceTypes();

  return (
    <ListPage
      title={t('Instance types')}
      description={t('Manage provider-defined instance types for this cloud platform.')}
      error={error}
      actions={
        <Button
          variant="primary"
          onClick={() => navigate('/admin/infrastructure/instance-types/create')}
        >
          {t('Create instance type')}
        </Button>
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <AdminInstanceTypeTable instanceTypes={instanceTypes} />
      </ListPageBody>
    </ListPage>
  );
};

export default AdminInstanceTypeListPage;
