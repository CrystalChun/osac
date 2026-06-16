/**
 * flow: manage-virtual-machines
 * steps: mvm_list_view, mvm_detail_drawer
 */
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bullseye,
  Button,
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
  useComputeInstances,
  usePatchComputeInstance,
} from '@osac/ui-components/api/v1/compute-instance';
import { SubtleContent } from '@osac/ui-components/components/SubtleContent/SubtleContent';
import { useSession } from '@osac/ui-components/hooks/use-session';
import { useVmPowerActionDisplay } from '@osac/ui-components/hooks/useVmPowerActionDisplay';
import { COMPUTE_INSTANCE_STATE } from '@osac/ui-components/vmDisplayState';

import { PageDataSection } from '../../components/layout/PageDataSection';
import { PageHeader } from '../../components/layout/PageHeader';
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
  const navigate = useNavigate();
  const { role } = useSession();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [powerFilter, setPowerFilter] = useState<VmPowerFilter>(() =>
    normalizePowerFilter(searchParams.get('power')),
  );

  const qc = useApiQueryClient();
  const { data: vms = [], isLoading } = useComputeInstances();
  const patchVm = usePatchComputeInstance();
  const invalidateInstances = useCallback(() => invalidateComputeInstancesQueries(qc), [qc]);
  const { getDisplayState } = useVmPowerActionDisplay(vms, patchVm.mutate, { invalidateInstances });

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
    navigate('/vms/create');
  }, [navigate]);

  return (
    <PageSection isFilled className="osac-page">
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
          <SubtleContent component="p" className="osac-vm-list__empty">
            {search || powerFilter !== 'all'
              ? 'No virtual machines match your filters.'
              : 'No virtual machines yet. Create one to get started.'}
          </SubtleContent>
        ) : (
          /* RESTORE clone: onClone={(vm) => navigate('/vms/create', { state: { cloneFromId: vm.id } })} */
          <VmTable vms={filteredVms} getState={getDisplayState} />
        )}
      </PageDataSection>
    </PageSection>
  );
};
