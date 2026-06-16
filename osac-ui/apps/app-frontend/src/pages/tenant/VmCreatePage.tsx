import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageSection } from '@patternfly/react-core';

import { useApiQueryClient } from '@osac/ui-components/api/use-api-query';
import {
  invalidateComputeInstancesQueries,
  pollComputeInstancesUntilListed,
  useProvisionComputeInstance,
} from '@osac/ui-components/api/v1/compute-instance';
import type { BuildComputeInstanceCreateBodyInput } from '@osac/ui-components/api/v1/compute-instance-wire';

import {
  CatalogProvisionWizard,
  type CatalogProvisionWizardHandle,
} from '../../components/catalogProvision/CatalogProvisionWizard';

interface VmCreateLocationState {
  catalogItemId?: string;
}

export const VmCreatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const wizardRef = useRef<CatalogProvisionWizardHandle>(null);
  const postCreatePollRef = useRef<{ cancelled: boolean } | undefined>(undefined);
  const qc = useApiQueryClient();
  const provisionVm = useProvisionComputeInstance();

  const catalogItemId = (location.state as VmCreateLocationState | null)?.catalogItemId;

  useEffect(
    () => () => {
      if (postCreatePollRef.current) {
        postCreatePollRef.current.cancelled = true;
      }
    },
    [],
  );

  useEffect(() => {
    if (catalogItemId) {
      wizardRef.current?.openFromCatalogItem(catalogItemId);
      return;
    }
    wizardRef.current?.open();
  }, [catalogItemId]);

  const handleWizardClosed = useCallback(() => {
    navigate('/vms');
  }, [navigate]);

  const handleWizardProvision = useCallback(
    async (vm: BuildComputeInstanceCreateBodyInput) => {
      if (postCreatePollRef.current) {
        postCreatePollRef.current.cancelled = true;
      }
      const pollSignal = { cancelled: false };
      postCreatePollRef.current = pollSignal;

      const created = await provisionVm.mutateAsync({
        vm,
        specCatalogItemOnly: true,
      });

      if (created.id) {
        void pollComputeInstancesUntilListed(qc, created.id, pollSignal);
        navigate(`/vms/${created.id}`);
        return;
      }

      void invalidateComputeInstancesQueries(qc);
      navigate('/vms');
    },
    [navigate, provisionVm, qc],
  );

  return (
    <PageSection isFilled className="osac-page">
      <CatalogProvisionWizard
        ref={wizardRef}
        breadcrumbParentLabel="Virtual machines"
        onProvision={handleWizardProvision}
        onClosed={handleWizardClosed}
      />
    </PageSection>
  );
};
