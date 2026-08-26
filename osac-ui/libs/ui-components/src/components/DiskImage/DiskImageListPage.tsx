import { useTranslation } from '../../hooks/useTranslation';
import ListPage from '../Page/ListPage';

const DiskImageListPage = () => {
  const { t } = useTranslation();

  return <ListPage title={t('Disk images')}>{null}</ListPage>;
};

export default DiskImageListPage;
