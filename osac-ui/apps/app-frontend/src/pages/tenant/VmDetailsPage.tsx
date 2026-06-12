import * as React from 'react';
import { VmDetailDrawer } from '../../components/vm/VmDetailDrawer';
import { Bullseye, PageSection, Spinner } from '@patternfly/react-core';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ComputeInstance,
  refetchComputeInstance,
  useComputeInstance,
  usePatchVm,
} from '../../api/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useVmPowerActionDisplay } from '../../api/useVmPowerActionDisplay';
import { usePendingVmCreations } from '../../api/usePendingVmCreations';
import { isPendingVmClientId } from '../../api/pendingVmCreation';
import { VmDeleteConfirmModal } from '../../components/vm/VmDeleteConfirmModal';

const VmDetailsPageInner = ({ vm }: { vm: ComputeInstance }) => {
  const navigate = useNavigate();
  const [deleteVm, setDeleteVm] = React.useState(false);

  const queryClient = useQueryClient();
  const refetchInstances = React.useCallback(
    () => refetchComputeInstance(vm.id, queryClient),
    [queryClient, vm.id],
  );

  const patchVm = usePatchVm();

  const { getDisplayState, runPowerAction, isPowerActionPending, isRestarting } =
    useVmPowerActionDisplay([vm], patchVm.mutate, { refetchInstances });

  const { getCreationDisplayState, getPostCreateDisplayState } = usePendingVmCreations([vm], {
    refetchInstances,
  });

  const getVmDisplayState = React.useCallback(
    (vm: ComputeInstance) => {
      if (isPendingVmClientId(vm.id)) {
        return getCreationDisplayState(vm.id);
      }
      const postCreate = getPostCreateDisplayState(vm);
      if (postCreate) {
        return postCreate;
      }
      return getDisplayState(vm);
    },
    [getCreationDisplayState, getPostCreateDisplayState, getDisplayState],
  );

  const handlePowerAction = React.useCallback(
    (vm: ComputeInstance, action: 'start' | 'stop' | 'restart') => {
      runPowerAction(vm, action);
    },
    [runPowerAction],
  );

  const detailState = getVmDisplayState(vm);
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
