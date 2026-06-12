/**
 * flow: manage-virtual-machines
 * steps: mvm_list_view, mvm_detail_drawer
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bullseye,
  Button,
  Content,
  Divider,
  Flex,
  FlexItem,
  PageSection,
  SearchInput,
  Spinner,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import type { ComputeInstance } from '@osac/api-contracts/types';
import { useSession } from '@osac/ui-components/hooks/use-session';

import {
  refetchComputeInstancesQueries,
  useComputeInstances,
  usePatchVm,
  useProvisionVm,
} from '../../api/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { listPostCreateWatchIds } from '../../api/postCreateWatchStore';
import { isPendingVmClientId } from '../../api/pendingVmCreation';
import { pinProvisioningVmsToListEnd } from '../../api/vmListDisplayOrder';
import { usePendingVmCreations } from '../../api/usePendingVmCreations';
import { useVmPowerActionDisplay } from '../../api/useVmPowerActionDisplay';
import { VmDeleteConfirmModal } from '../../components/vm/VmDeleteConfirmModal';
import { PageHeader } from '../../components/layout/PageHeader';
import {
  CatalogProvisionWizard,
  type CatalogProvisionWizardHandle,
} from '../../components/catalogProvision/CatalogProvisionWizard';
import { VmTable } from '../../components/vm/VmTable';
import { PageDataSection } from '../../components/layout/PageDataSection';

import './VmListPage.css';

const POWER_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'running', label: 'Running' },
  { value: 'stopped', label: 'Stopped' },
] as const;

type VmPowerFilter = (typeof POWER_FILTERS)[number]['value'];

const normalizePowerFilter = (value: string | null): VmPowerFilter => {
  if (!value) {
    return 'all';
  }
  return POWER_FILTERS.some((option) => option.value === value) ? (value as VmPowerFilter) : 'all';
};

export const VmListPage = () => {
  const { role } = useSession();
  const [searchParams] = useSearchParams();
  const wizardRef = useRef<CatalogProvisionWizardHandle>(null);

  const [search, setSearch] = useState('');
  const [powerFilter, setPowerFilter] = useState<VmPowerFilter>(() =>
    normalizePowerFilter(searchParams.get('power')),
  );

  const [vmToDelete, setVmToDelete] = useState<string>();

  const queryClient = useQueryClient();
  const { data: vms = [], isLoading } = useComputeInstances();
  const provisionVm = useProvisionVm();
  const patchVm = usePatchVm();
  const refetchInstances = useCallback(
    () => refetchComputeInstancesQueries(queryClient),
    [queryClient],
  );
  const { getDisplayState, runPowerAction, isPowerActionPending, isRestarting } =
    useVmPowerActionDisplay(vms, patchVm.mutate, { refetchInstances });
  const {
    registerPending,
    noteCreateSuccess,
    dismissPending,
    pendingInstances,
    getCreationDisplayState,
    getPostCreateDisplayState,
  } = usePendingVmCreations(vms, { refetchInstances });

  const handleWizardProvision = useCallback(
    async (vm: Partial<ComputeInstance>) => {
      const clientId = registerPending(vm);
      try {
        const created = await provisionVm.mutateAsync({
          vm,
          specCatalogItemOnly: true,
        });
        noteCreateSuccess(clientId, created.id);
        void refetchInstances();
      } catch {
        dismissPending(clientId);
        throw new Error('Provisioning failed');
      }
    },
    [dismissPending, noteCreateSuccess, provisionVm, refetchInstances, registerPending],
  );

  const isPendingCreation = useCallback((vm: ComputeInstance) => isPendingVmClientId(vm.id), []);

  const getVmDisplayState = useCallback(
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

  const filteredVms = useMemo(() => {
    const pending = powerFilter === 'all' ? pendingInstances() : [];
    const merged = [...vms, ...pending];
    const filtered = merged.filter((vm) => {
      const matchesSearch =
        !search || vm.metadata.name.toLowerCase().includes(search.toLowerCase());
      if (isPendingVmClientId(vm.id)) {
        return matchesSearch;
      }
      const state = getVmDisplayState(vm);
      const matchesPower = powerFilter === 'all' || state === powerFilter;
      return matchesSearch && matchesPower;
    });
    return pinProvisioningVmsToListEnd(filtered, listPostCreateWatchIds());
  }, [getVmDisplayState, pendingInstances, powerFilter, search, vms]);

  const handleOpenCreateVm = useCallback(() => {
    wizardRef.current?.open();
  }, []);

  const deleteVm = vms.find((vm) => vm.id === vmToDelete);

  return (
    <PageSection isFilled className="osac-page">
      {deleteVm && (
        <VmDeleteConfirmModal
          vm={deleteVm}
          onClose={() => setVmToDelete(undefined)}
          onSuccess={() => {
            setVmToDelete(undefined);
            refetchInstances();
          }}
        />
      )}
      <CatalogProvisionWizard
        ref={wizardRef}
        breadcrumbParentLabel="Virtual machines"
        onProvision={handleWizardProvision}
      />
      <PageHeader
        title="Virtual machines"
        description="View and filter your virtual machines."
        descriptionWidth="wide"
        actions={
          role === 'tenantUser' ? (
            <Button variant="primary" onClick={handleOpenCreateVm}>
              Create virtual machine
            </Button>
          ) : undefined
        }
      />

      <Divider className="osac-vm-list__divider" />

      <PageDataSection scrollable>
        <Flex
          spaceItems={{ default: 'spaceItemsSm' }}
          alignItems={{ default: 'alignItemsCenter' }}
          flexWrap={{ default: 'wrap' }}
          className="osac-vm-list__toolbar"
        >
          <FlexItem>
            <SearchInput
              placeholder="Search VMs by name…"
              value={search}
              onChange={(_e, v) => setSearch(v)}
              onClear={() => setSearch('')}
              className="osac-vm-list__search"
            />
          </FlexItem>
          <FlexItem>
            <ToggleGroup
              aria-label="Filter virtual machines by status"
              className="osac-vm-list__status-toggle"
            >
              {POWER_FILTERS.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  text={option.label}
                  buttonId={`vm-filter-status-${option.value}`}
                  isSelected={powerFilter === option.value}
                  onChange={() => setPowerFilter(option.value)}
                />
              ))}
            </ToggleGroup>
          </FlexItem>
        </Flex>

        {isLoading ? (
          <Bullseye className="osac-vm-list__loading">
            <Spinner aria-label="Loading virtual machines" />
          </Bullseye>
        ) : filteredVms.length === 0 ? (
          <Content component="p" className="osac-vm-list__empty">
            {search || powerFilter !== 'all'
              ? 'No virtual machines match your filters.'
              : 'No virtual machines yet. Create one to get started.'}
          </Content>
        ) : (
          /* RESTORE clone: onClone={(vm) => wizardRef.current?.openFromClone(vm.id)} */
          <VmTable
            vms={filteredVms}
            getState={getVmDisplayState}
            isPendingCreation={isPendingCreation}
            isRestarting={(vm) => isRestarting(vm.id)}
            isPowerActionPending={(vm) => isPowerActionPending(vm.id)}
            onPower={runPowerAction}
            onDelete={(vm) => setVmToDelete(vm.id)}
          />
        )}
      </PageDataSection>
    </PageSection>
  );
};
