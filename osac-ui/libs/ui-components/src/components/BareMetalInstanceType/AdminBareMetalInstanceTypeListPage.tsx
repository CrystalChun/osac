import AdminBareMetalInstanceTypeTable from './AdminBareMetalInstanceTypeTable';
import { useAdminBareMetalInstanceTypes } from '../../api/v1/private/baremetal-instance-type';
import { useTranslation } from '../../hooks/useTranslation';
import ListPage from '../Page/ListPage';
import ListPageBody from '../Page/ListPageBody';

const AdminBareMetalInstanceTypeListPage = () => {
  const { t } = useTranslation();
  const { data: bareMetalInstanceTypes = [], isLoading, error } = useAdminBareMetalInstanceTypes();

  return (
    <ListPage
      title={t('Bare metal instance types')}
      description={t('Manage provider-defined bare metal instance types for this cloud platform.')}
      error={error}
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <AdminBareMetalInstanceTypeTable bareMetalInstanceTypes={bareMetalInstanceTypes} />
      </ListPageBody>
    </ListPage>
  );
};

export default AdminBareMetalInstanceTypeListPage;
