/**
 * flow: manage-virtual-machines
 * steps: mvm_list_view, mvm_detail_drawer
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { useApiQueryClient } from '@osac/ui-components/api/use-api-query';
import {
  invalidateComputeInstancesQueries,
  pollComputeInstancesUntilListed,
  useComputeInstances,
  usePatchComputeInstance,
  useProvisionComputeInstance,
} from '@osac/ui-components/api/v1/compute-instance';
import type { BuildComputeInstanceCreateBodyInput } from '@osac/ui-components/api/v1/compute-instance-wire';
import { useSession } from '@osac/ui-components/hooks/use-session';
import { COMPUTE_INSTANCE_STATE } from '@osac/ui-components/vmDisplayState';

import { useVmPowerActionDisplay } from '../../api/useVmPowerActionDisplay';
import {
  CatalogProvisionWizard,
  type CatalogProvisionWizardHandle,
} from '../../components/catalogProvision/CatalogProvisionWizard';
import { PageDataSection } from '../../components/layout/PageDataSection';
import { PageHeader } from '../../components/layout/PageHeader';
import { VmDeleteConfirmModal } from '../../components/vm/VmDeleteConfirmModal';
import { VmTable } from '../../components/vm/VmTable';

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
  const postCreatePollRef = useRef<{ cancelled: boolean } | undefined>(undefined);

  useEffect(
    () => () => {
      if (postCreatePollRef.current) {
        postCreatePollRef.current.cancelled = true;
      }
    },
    [],
  );

  const [search, setSearch] = useState('');
  const [powerFilter, setPowerFilter] = useState<VmPowerFilter>(() =>
    normalizePowerFilter(searchParams.get('power')),
  );

  const [vmToDelete, setVmToDelete] = useState<string>();

  const qc = useApiQueryClient();
  const { data: vms = [], isLoading } = useComputeInstances();
  const provisionVm = useProvisionComputeInstance();
  const patchVm = usePatchComputeInstance();
  const invalidateInstances = useCallback(() => invalidateComputeInstancesQueries(qc), [qc]);
  const { getDisplayState, runPowerAction, isPowerActionPending, isRestarting } =
    useVmPowerActionDisplay(vms, patchVm.mutate, { invalidateInstances });

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
      } else {
        void invalidateInstances();
      }
    },
    [invalidateInstances, provisionVm, qc],
  );

  const filteredVms = useMemo(() => {
    return vms.filter((vm) => {
      const name = vm.metadata?.name ?? '';
      const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase());
      const state = getDisplayState(vm);
      const matchesPower =
        powerFilter === 'all' ||
        (powerFilter === 'running' && state === COMPUTE_INSTANCE_STATE.RUNNING) ||
        (powerFilter === 'stopped' && state === COMPUTE_INSTANCE_STATE.STOPPED);
      return matchesSearch && matchesPower;
    });
  }, [getDisplayState, powerFilter, search, vms]);

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
            void invalidateInstances();
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
            getState={getDisplayState}
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
