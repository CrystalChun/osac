import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Content,
  PageSection,
  Stack,
  Title,
} from '@patternfly/react-core';

import { type Cluster } from '@osac/types';
import { apiQueryKey } from '@osac/ui-components/api/types';
import { useApiQueryClient } from '@osac/ui-components/api/use-api-query';
import { useProvisionCluster } from '@osac/ui-components/api/v1/cluster';
import {
  type BuildClusterCreateBodyInput,
  buildClusterCreateBody,
} from '@osac/ui-components/api/v1/cluster-wire';
import {
  CatalogProvisionWizard,
  type CatalogProvisionWizardCloseHandler,
} from '@osac/ui-components/components/catalogProvision/CatalogProvisionWizard';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

export const ClusterCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { catalogItemId } = useParams<{ catalogItemId?: string }>();
  const provisionCluster = useProvisionCluster();
  const qc = useApiQueryClient();
  const [closeHandler, setCloseHandler] = useState<CatalogProvisionWizardCloseHandler | null>(null);

  const handleCloseHandlerChange = useCallback((handler: CatalogProvisionWizardCloseHandler) => {
    setCloseHandler(handler);
  }, []);

  const handleWizardClosed = useCallback(() => {
    navigate('/clusters');
  }, [navigate]);

  const handleWizardProvision = useCallback(
    async (cluster: BuildClusterCreateBodyInput) => {
      const created = await provisionCluster.mutateAsync(
        buildClusterCreateBody(cluster) as Cluster,
      );
      if (!created.id) {
        throw new Error('Create response missing id');
      }
      qc.setQueryData(apiQueryKey('v1/clusters', [created.id]), created);
      navigate(`/clusters/${created.id}`, { replace: true });
    },
    [navigate, provisionCluster, qc],
  );

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button
                variant="link"
                isInline
                onClick={() => closeHandler?.requestClose()}
                isDisabled={closeHandler?.pending}
              >
                {t('Clusters')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('Create')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('Create cluster')}
          </Title>
          <Content component="p">
            {t('Select a catalog item, configure, and provision an OpenShift cluster.')}
          </Content>
        </Stack>
      </PageSection>
      <CatalogProvisionWizard
        kind="cluster"
        initialCatalogItemId={catalogItemId}
        onProvision={handleWizardProvision}
        onClosed={handleWizardClosed}
        onCloseHandlerChange={handleCloseHandlerChange}
      />
    </>
  );
};
