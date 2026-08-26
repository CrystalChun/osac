import { useTranslation } from '../../hooks/useTranslation';
import ListPage from '../Page/ListPage';

const DiskImageDetailPage = () => {
  const { t } = useTranslation();

  return <ListPage title={t('Disk image details')}>{null}</ListPage>;
};

export default DiskImageDetailPage;
