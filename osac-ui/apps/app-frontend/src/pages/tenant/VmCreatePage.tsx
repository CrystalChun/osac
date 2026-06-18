import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageSection } from '@patternfly/react-core';

import { useProvisionComputeInstance } from '@osac/ui-components/api/v1/compute-instance';
import type { BuildComputeInstanceCreateBodyInput } from '@osac/ui-components/api/v1/compute-instance-wire';

import { CatalogProvisionWizard } from '../../components/catalogProvision/CatalogProvisionWizard';

export const VmCreatePage = () => {
  const navigate = useNavigate();
  const { catalogItemId } = useParams<{ catalogItemId?: string }>();
  const provisionVm = useProvisionComputeInstance();

  const handleWizardClosed = useCallback(() => {
    navigate('/vms');
  }, [navigate]);

  const handleWizardProvision = useCallback(
    async (vm: BuildComputeInstanceCreateBodyInput) => {
      const created = await provisionVm.mutateAsync({
        vm,
        specCatalogItemOnly: true,
      });
      navigate(created.id ? `/vms/${created.id}` : '/vms');
    },
    [navigate, provisionVm],
  );

  return (
    <PageSection isFilled className="osac-page">
      <CatalogProvisionWizard
        initialCatalogItemId={catalogItemId}
        breadcrumbParentLabel="Virtual machines"
        onProvision={handleWizardProvision}
        onClosed={handleWizardClosed}
      />
    </PageSection>
  );
};
