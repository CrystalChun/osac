import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Flex,
  FlexItem,
  SearchInput,
  Stack,
  StackItem,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';

import { ComputeInstanceState } from '@osac/types';
import { useComputeInstances } from '@osac/ui-components/api/v1/compute-instance';
import { useInstanceTypes } from '@osac/ui-components/api/v1/instance-types';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { SubtleContent } from '@osac/ui-components/components/SubtleContent/SubtleContent';
import { VmTable } from '@osac/ui-components/components/vm/VmTable';
import { useSession } from '@osac/ui-components/hooks/use-session';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import { getErrorMessage } from '@osac/ui-components/utils/error';

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
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [powerFilter, setPowerFilter] = useState<VmPowerFilter>(() =>
    normalizePowerFilter(searchParams.get('power')),
  );

  const { data: vms = [], isLoading, error } = useComputeInstances();
  const {
    data: instanceTypes = [],
    isLoading: isInstanceTypesLoading,
    error: instanceTypesError,
  } = useInstanceTypes();

  const filteredVms = useMemo(() => {
    return vms.filter((vm) => {
      const name = vm.metadata?.name ?? '';
      const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase());
      const state = vm.status?.state;
      const matchesPower =
        powerFilter === 'all' ||
        (powerFilter === 'running' && state === ComputeInstanceState.RUNNING) ||
        (powerFilter === 'stopped' && state === ComputeInstanceState.STOPPED);
      return matchesSearch && matchesPower;
    });
  }, [powerFilter, search, vms]);

  return (
    <ListPage
      title="Virtual machines"
      description="View and filter your virtual machines."
      error={error}
      actions={
        role === 'tenantUser' ? (
          <Button variant="primary" onClick={() => navigate('/vms/create')}>
            Create virtual machine
          </Button>
        ) : undefined
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Stack hasGutter>
          <StackItem>
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
          </StackItem>
          {instanceTypesError ? (
            <StackItem>
              <Alert variant="danger" title={t('Could not load instance types')} isInline>
                {getErrorMessage(instanceTypesError)}
              </Alert>
            </StackItem>
          ) : null}
          <StackItem>
            {filteredVms.length === 0 ? (
              <SubtleContent component="p" className="osac-vm-list__empty">
                {search || powerFilter !== 'all'
                  ? 'No virtual machines match your filters.'
                  : 'No virtual machines yet. Create one to get started.'}
              </SubtleContent>
            ) : (
              <VmTable
                vms={filteredVms}
                instanceTypes={instanceTypes}
                isInstanceTypesLoading={isInstanceTypesLoading}
              />
            )}
          </StackItem>
        </Stack>
      </ListPageBody>
    </ListPage>
  );
};
