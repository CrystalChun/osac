import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bullseye, PageSection, Spinner } from '@patternfly/react-core';

import type { ComputeInstance } from '@osac/types';
import { useApiQueryClient } from '@osac/ui-components/api/use-api-query';
import {
  invalidateComputeInstancesQueries,
  useComputeInstance,
} from '@osac/ui-components/api/v1/compute-instance';
import { usePatchComputeInstance } from '@osac/ui-components/api/v1/compute-instance';

import { useVmPowerActionDisplay } from '../../api/useVmPowerActionDisplay';
import { VmDeleteConfirmModal } from '../../components/vm/VmDeleteConfirmModal';
import { VmDetailDrawer } from '../../components/vm/VmDetailDrawer';

const VmDetailsPageInner = ({ vm }: { vm: ComputeInstance }) => {
  const navigate = useNavigate();
  const [deleteVm, setDeleteVm] = React.useState(false);

  const qc = useApiQueryClient();
  const patchVm = usePatchComputeInstance();
  const invalidateInstances = React.useCallback(() => invalidateComputeInstancesQueries(qc), [qc]);

  const { getDisplayState, runPowerAction, isPowerActionPending, isRestarting } =
    useVmPowerActionDisplay([vm], patchVm.mutate, { invalidateInstances });

  const handlePowerAction = React.useCallback(
    (vm: ComputeInstance, action: 'start' | 'stop' | 'restart') => {
      runPowerAction(vm, action);
    },
    [runPowerAction],
  );

  const detailState = getDisplayState(vm);
  return (
    <PageSection isFilled>
      {deleteVm && (
        <VmDeleteConfirmModal
          vm={vm}
          onClose={() => setDeleteVm(false)}
          onSuccess={() => navigate('/vms')}
        />
      )}
      <VmDetailDrawer
        vm={vm}
        effectiveState={detailState}
        onPower={(action) => handlePowerAction(vm, action)}
        onDelete={() => setDeleteVm(true)}
        isRestarting={isRestarting(vm.id)}
        isPowerActionPending={isPowerActionPending(vm.id)}
      />
    </PageSection>
  );
};

const VmDetailsPage = () => {
  const { id } = useParams() as { id: string };

  const { data: vm, isLoading } = useComputeInstance(id);

  if (isLoading || !vm) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return <VmDetailsPageInner vm={vm} />;
};

export default VmDetailsPage;
