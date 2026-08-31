import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, Button } from '@patternfly/react-core';

import DiskImageForm, { DISK_IMAGES_LIST_ROUTE } from './DiskImageForm';
import { useDiskImage } from '../../api/v1/disk-image';
import { useTranslation } from '../../hooks/useTranslation';
import ListPage from '../Page/ListPage';
import ListPageBody from '../Page/ListPageBody';

const DiskImageCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const { data: diskImage, isLoading, error } = useDiskImage(id);

  return (
    <ListPage
      title={t(isEdit ? 'Edit disk image' : 'Create disk image')}
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbItem>
            <Button variant="link" isInline onClick={() => navigate(DISK_IMAGES_LIST_ROUTE)}>
              {t('Disk images')}
            </Button>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{t(isEdit ? 'Edit' : 'Create')}</BreadcrumbItem>
        </Breadcrumb>
      }
    >
      <ListPageBody isLoading={isEdit && isLoading} error={error}>
        <DiskImageForm diskImage={diskImage} />
      </ListPageBody>
    </ListPage>
  );
};

export default DiskImageCreatePage;
