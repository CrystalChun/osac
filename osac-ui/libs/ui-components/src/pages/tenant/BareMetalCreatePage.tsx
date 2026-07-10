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

import { useCreateBareMetalInstance } from '@osac/ui-components/api/v1/baremetal-instance';
import {
  type CatalogProvisionPayload,
  CatalogProvisionWizard,
  type CatalogProvisionWizardCloseHandler,
} from '@osac/ui-components/components/catalogProvision/CatalogProvisionWizard';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

export const BareMetalCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { catalogItemId } = useParams<{ catalogItemId?: string }>();
  const createBareMetalInstance = useCreateBareMetalInstance();
  const [closeHandler, setCloseHandler] = useState<CatalogProvisionWizardCloseHandler | null>(null);

  const handleCloseHandlerChange = useCallback((handler: CatalogProvisionWizardCloseHandler) => {
    setCloseHandler(handler);
  }, []);

  const handleWizardClosed = useCallback(() => {
    navigate('/bare-metal');
  }, [navigate]);

  const handleWizardProvision = useCallback(
    async (payload: CatalogProvisionPayload) => {
      const instance = await createBareMetalInstance.mutateAsync(payload);
      navigate(`/bare-metal/${instance.id}`);
    },
    [createBareMetalInstance, navigate],
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
                {t('Bare Metal')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('Provision bare metal')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('Provision bare metal')}
          </Title>
          <Content component="p">
            {t('Provision a bare metal instance from a catalog item.')}
          </Content>
        </Stack>
      </PageSection>
      <CatalogProvisionWizard
        kind="bare_metal_instance"
        initialCatalogItemId={catalogItemId}
        onProvision={handleWizardProvision}
        onClosed={handleWizardClosed}
        onCloseHandlerChange={handleCloseHandlerChange}
      />
    </>
  );
};
