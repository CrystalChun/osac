import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Bullseye,
  Button,
  PageSection,
  Spinner,
  Stack,
  Title,
} from '@patternfly/react-core';

import BareMetalInstanceTypeWizard, {
  BAREMETAL_INSTANCE_TYPES_LIST_ROUTE,
} from './BareMetalInstanceTypeWizard';
import { useAdminBareMetalInstanceType } from '../../../api/v1/private/baremetal-instance-type';
import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/error';

const AdminBareMetalInstanceTypeCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { data, isLoading, error } = useAdminBareMetalInstanceType(id ?? '');

  const title = isEdit ? t('Edit bare metal instance type') : t('Create bare metal instance type');

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button
                variant="link"
                isInline
                onClick={() => navigate(BAREMETAL_INSTANCE_TYPES_LIST_ROUTE)}
              >
                {t('Bare metal instance types')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{isEdit ? t('Edit') : t('Create')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {title}
          </Title>
        </Stack>
      </PageSection>
      {isEdit && isLoading ? (
        <PageSection hasBodyWrapper={false}>
          <Bullseye>
            <Spinner />
          </Bullseye>
        </PageSection>
      ) : isEdit && error ? (
        <PageSection hasBodyWrapper={false}>
          <Alert variant="danger" isInline title={t('Failed to fetch bare metal instance type')}>
            {getErrorMessage(error)}
          </Alert>
        </PageSection>
      ) : (
        <BareMetalInstanceTypeWizard bareMetalInstanceType={data} />
      )}
    </>
  );
};

export default AdminBareMetalInstanceTypeCreatePage;
