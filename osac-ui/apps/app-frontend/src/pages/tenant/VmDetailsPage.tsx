import * as React from 'react';
import { Bullseye, PageSection, Spinner } from '@patternfly/react-core';
import { useNavigate, useParams } from 'react-router-dom';
import { useComputeInstance } from '@osac/ui-components/api/v1/compute-instance';
import { ComputeInstance } from '@osac/types';

import { VmDetailDrawer } from '../../components/vm/VmDetailDrawer';
import { ComputeInstance as OldComputeInstance, usePatchVm } from '../../api/hooks';
import { useVmPowerActionDisplay } from '../../api/useVmPowerActionDisplay';
import { usePendingVmCreations } from '../../api/usePendingVmCreations';
import { isPendingVmClientId } from '../../api/pendingVmCreation';
import { VmDeleteConfirmModal } from '../../components/vm/VmDeleteConfirmModal';

const VmDetailsPageInner = ({ vm }: { vm: ComputeInstance }) => {
  const navigate = useNavigate();
  const [deleteVm, setDeleteVm] = React.useState(false);

  const patchVm = usePatchVm();

  const { getDisplayState, runPowerAction, isPowerActionPending, isRestarting } =
    useVmPowerActionDisplay([vm as unknown as OldComputeInstance], patchVm.mutate);

  const { getCreationDisplayState, getPostCreateDisplayState } = usePendingVmCreations([
    vm as unknown as OldComputeInstance,
  ]);

  const getVmDisplayState = React.useCallback(
    (vm: ComputeInstance) => {
      if (isPendingVmClientId(vm.id)) {
        return getCreationDisplayState(vm.id);
      }
      const postCreate = getPostCreateDisplayState(vm as unknown as OldComputeInstance);
      if (postCreate) {
        return postCreate;
      }
      return getDisplayState(vm as unknown as OldComputeInstance);
    },
    [getCreationDisplayState, getPostCreateDisplayState, getDisplayState],
  );

  const handlePowerAction = React.useCallback(
    (vm: ComputeInstance, action: 'start' | 'stop' | 'restart') => {
      runPowerAction(vm as unknown as OldComputeInstance, action);
    },
    [runPowerAction],
  );

  const detailState = getVmDisplayState(vm);
  return (
    <PageSection isFilled>
      {deleteVm && (
        <VmDeleteConfirmModal
          vm={vm as unknown as OldComputeInstance}
          onClose={() => setDeleteVm(false)}
          onSuccess={() => navigate('/vms')}
        />
      )}
      <VmDetailDrawer
        vm={vm as unknown as OldComputeInstance}
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
