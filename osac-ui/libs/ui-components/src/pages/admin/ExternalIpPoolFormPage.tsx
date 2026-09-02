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

import { ExternalIPPools } from '@osac/types/private';
import { useGetResource } from '@osac/ui-components/api/use-resource';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import { getErrorMessage } from '@osac/ui-components/utils/error';

import ExternalIpPoolForm, { POOLS_LIST_PATH } from './ExternalIpPoolForm';

export const ExternalIpPoolFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { data, isLoading, error } = useGetResource(
    ExternalIPPools,
    { id: id ?? '' },
    { enabled: isEdit },
  );

  const renderBody = () => {
    if (isEdit && isLoading) {
      return (
        <Bullseye>
          <Spinner />
        </Bullseye>
      );
    }

    if (isEdit && error) {
      return (
        <PageSection hasBodyWrapper={false}>
          <Alert variant="danger" isInline title={t('Failed to fetch external IP pool')}>
            {getErrorMessage(error)}
          </Alert>
        </PageSection>
      );
    }

    return <ExternalIpPoolForm pool={data?.object} />;
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate(POOLS_LIST_PATH)}>
                {t('External IP pools')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{isEdit ? t('Edit') : t('Create')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {isEdit ? t('Edit external IP pool') : t('Create external IP pool')}
          </Title>
        </Stack>
      </PageSection>
      {renderBody()}
    </>
  );
};
