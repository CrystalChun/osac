import { useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  PageSection,
  Stack,
  Title,
} from '@patternfly/react-core';

import InstanceTypeCreateForm from './CreatePage/InstanceTypeCreateForm';
import { useTranslation } from '../../hooks/useTranslation';

const AdminInstanceTypeCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button
                variant="link"
                isInline
                onClick={() => navigate('/admin/infrastructure/instance-types')}
              >
                {t('Instance types')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('Create')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('Create instance type')}
          </Title>
        </Stack>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <InstanceTypeCreateForm />
      </PageSection>
    </>
  );
};

export default AdminInstanceTypeCreatePage;
