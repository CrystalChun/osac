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

import { apiQueryKey } from '@osac/ui-components/api/types';
import { useApiQueryClient } from '@osac/ui-components/api/use-api-query';
import { useProvisionComputeInstance } from '@osac/ui-components/api/v1/compute-instance';
import type { BuildComputeInstanceCreateBodyInput } from '@osac/ui-components/api/v1/compute-instance-wire';
import {
  CatalogProvisionWizard,
  type CatalogProvisionWizardCloseHandler,
} from '@osac/ui-components/components/catalogProvision/CatalogProvisionWizard';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

export const VmCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { catalogItemId } = useParams<{ catalogItemId?: string }>();
  const provisionVm = useProvisionComputeInstance();
  const qc = useApiQueryClient();
  const [closeHandler, setCloseHandler] = useState<CatalogProvisionWizardCloseHandler | null>(null);

  const handleCloseHandlerChange = useCallback((handler: CatalogProvisionWizardCloseHandler) => {
    setCloseHandler(handler);
  }, []);

  const handleWizardClosed = useCallback(() => {
    navigate('/vms');
  }, [navigate]);

  const handleWizardProvision = useCallback(
    async (vm: BuildComputeInstanceCreateBodyInput) => {
      const { instance, warnings } = await provisionVm.mutateAsync({
        vm,
        specCatalogItemOnly: true,
      });
      if (!instance.id) {
        throw new Error('Create response missing id');
      }
      qc.setQueryData(apiQueryKey('v1/compute_instances', [instance.id]), instance);
      navigate(
        `/vms/${instance.id}`,
        warnings.length
          ? { replace: true, state: { provisionWarnings: warnings } }
          : { replace: true },
      );
    },
    [navigate, provisionVm, qc],
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
                {t('Virtual Machines')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('catalogProvision.vm.breadcrumbCreate')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('catalogProvision.vm.wizardTitle')}
          </Title>
          <Content component="p">{t('catalogProvision.vm.wizardDescription')}</Content>
        </Stack>
      </PageSection>
      <CatalogProvisionWizard
        initialCatalogItemId={catalogItemId}
        onProvision={handleWizardProvision}
        onClosed={handleWizardClosed}
        onCloseHandlerChange={handleCloseHandlerChange}
      />
    </>
  );
};
