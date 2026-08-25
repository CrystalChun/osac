import { useTranslation } from '../../hooks/useTranslation';
import ListPage from '../Page/ListPage';

const DiskImageCreatePage = () => {
  const { t } = useTranslation();

  return <ListPage title={t('Create disk image')}>{null}</ListPage>;
};

export default DiskImageCreatePage;
