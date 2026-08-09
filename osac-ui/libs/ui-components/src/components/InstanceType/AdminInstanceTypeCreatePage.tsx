import { useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  EmptyState,
  EmptyStateBody,
  PageSection,
  Stack,
} from '@patternfly/react-core';

import { useTranslation } from '../../hooks/useTranslation';

const AdminInstanceTypeCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
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
        <EmptyState headingLevel="h1" titleText={t('Create instance type')}>
          <EmptyStateBody>{t('This feature is coming soon.')}</EmptyStateBody>
        </EmptyState>
      </Stack>
    </PageSection>
  );
};

export default AdminInstanceTypeCreatePage;
