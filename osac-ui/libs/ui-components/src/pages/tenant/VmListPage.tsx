import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Flex,
  FlexItem,
  Label,
  SearchInput,
  Stack,
  StackItem,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';

import { ComputeInstance, ComputeInstanceState } from '@osac/types';
import { useComputeInstances } from '@osac/ui-components/api/v1/compute-instance';
import { useInstanceTypes } from '@osac/ui-components/api/v1/instance-types';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { SubtleContent } from '@osac/ui-components/components/SubtleContent/SubtleContent';
import { VmTable } from '@osac/ui-components/components/vm/VmTable';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import { getErrorMessage } from '@osac/ui-components/utils/error';

type VmStatusFilter = 'running' | 'stopped';

const STATUS_FILTER_PARAM = 'status';
const SEARCH_PARAM = 'search';
const VM_STATUS_FILTER_VALUES: readonly VmStatusFilter[] = ['running', 'stopped'];

const isVmStatusFilter = (value: string): value is VmStatusFilter =>
  value === 'running' || value === 'stopped';

const parseStatusFilters = (searchParams: URLSearchParams): VmStatusFilter[] => {
  const raw = searchParams.get(STATUS_FILTER_PARAM);
  if (!raw) {
    return [];
  }
  const seen = new Set<VmStatusFilter>();
  const filters: VmStatusFilter[] = [];
  for (const value of raw.split(',')) {
    const trimmed = value.trim();
    if (isVmStatusFilter(trimmed) && !seen.has(trimmed)) {
      seen.add(trimmed);
      filters.push(trimmed);
    }
  }
  return filters;
};

const serializeStatusFilters = (filters: VmStatusFilter[]): string | null =>
  filters.length > 0 ? filters.join(',') : null;

const parseSearch = (searchParams: URLSearchParams): string => searchParams.get(SEARCH_PARAM) ?? '';

const vmMatchesStatusFilter = (vm: ComputeInstance, filter: VmStatusFilter): boolean => {
  const state = vm.status?.state;
  if (filter === 'running') {
    return state === ComputeInstanceState.RUNNING;
  }
  return state === ComputeInstanceState.STOPPED;
};

const statusesWithItems = (vms: ComputeInstance[]): VmStatusFilter[] =>
  VM_STATUS_FILTER_VALUES.filter((status) => vms.some((vm) => vmMatchesStatusFilter(vm, status)));

export const VmListPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasInitializedStatusFilters = useRef(false);

  const statusFilters = useMemo(() => parseStatusFilters(searchParams), [searchParams]);
  const search = useMemo(() => parseSearch(searchParams), [searchParams]);

  const { data: vms = [], isLoading, error } = useComputeInstances();
  const {
    data: instanceTypes = [],
    isLoading: isInstanceTypesLoading,
    error: instanceTypesError,
  } = useInstanceTypes();

  useEffect(() => {
    if (hasInitializedStatusFilters.current || isLoading || error) {
      return;
    }
    hasInitializedStatusFilters.current = true;

    if (searchParams.has(STATUS_FILTER_PARAM)) {
      return;
    }

    const serialized = serializeStatusFilters(statusesWithItems(vms));
    if (!serialized) {
      return;
    }

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(STATUS_FILTER_PARAM, serialized);
        return next;
      },
      { replace: true },
    );
  }, [error, isLoading, searchParams, setSearchParams, vms]);

  const toggleStatusFilter = (value: VmStatusFilter) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const current = parseStatusFilters(next);
        const updated = current.includes(value)
          ? current.filter((option) => option !== value)
          : [...current, value];
        const serialized = serializeStatusFilters(updated);
        if (serialized) {
          next.set(STATUS_FILTER_PARAM, serialized);
        } else {
          next.set(STATUS_FILTER_PARAM, '');
        }
        return next;
      },
      { replace: true },
    );
  };

  const setSearch = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const trimmed = value.trim();
        if (!trimmed) {
          next.delete(SEARCH_PARAM);
        } else {
          next.set(SEARCH_PARAM, value);
        }
        return next;
      },
      { replace: true },
    );
  };

  const statusFilterOptions = useMemo<ReadonlyArray<{ value: VmStatusFilter; label: string }>>(
    () => [
      { value: 'running', label: t('Running') },
      { value: 'stopped', label: t('Stopped') },
    ],
    [t],
  );

  const statusCounts = useMemo(() => ({
    running: vms.filter((vm) => vmMatchesStatusFilter(vm, 'running')).length,
    stopped: vms.filter((vm) => vmMatchesStatusFilter(vm, 'stopped')).length,
  }), [vms]);

  const filteredVms = useMemo(() => {
    if (statusFilters.length === 0) {
      return [];
    }
    const searchTerm = search.trim().toLowerCase();
    return vms.filter((vm) => {
      const name = vm.metadata?.name ?? '';
      const matchesSearch = !searchTerm || name.toLowerCase().includes(searchTerm);
      const matchesStatus = statusFilters.some((filter) => vmMatchesStatusFilter(vm, filter));
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilters, vms]);

  const showEmptyState = !isLoading && !error && filteredVms.length === 0;

  return (
    <ListPage
      title={t('Virtual machines')}
      description={t('View and filter your virtual machines.')}
      error={error}
      actions={
        <Button variant="primary" onClick={() => navigate('/vms/create')}>
          {t('Create virtual machine')}
        </Button>
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Stack hasGutter>
          <StackItem>
            <Flex
              spaceItems={{ default: 'spaceItemsSm' }}
              alignItems={{ default: 'alignItemsCenter' }}
              flexWrap={{ default: 'wrap' }}
            >
              <FlexItem>
                <ToggleGroup aria-label={t('Filter virtual machines by status')}>
                  {statusFilterOptions.map((option) => (
                    <ToggleGroupItem
                      key={option.value}
                      text={(
                        <Flex spaceItems={{ default: 'spaceItemsSm' }} flexWrap={{ default: 'nowrap' }}>
                          <FlexItem>{option.label}</FlexItem>
                          <FlexItem>
                            <Label isCompact>{statusCounts[option.value]}</Label>
                          </FlexItem>
                        </Flex>
                      )}
                      buttonId={`vm-filter-status-${option.value}`}
                      isSelected={statusFilters.includes(option.value)}
                      onChange={() => toggleStatusFilter(option.value)}
                    />
                  ))}
                </ToggleGroup>
              </FlexItem>
              <FlexItem>
                <SearchInput
                  placeholder={t('Search VMs by name…')}
                  value={search}
                  onChange={(_event, value) => setSearch(value)}
                  onClear={() => setSearch('')}
                  aria-label={t('Filter virtual machines by name')}
                  isDisabled={isLoading || !!error}
                />
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
            {showEmptyState ? (
              <SubtleContent component="p">
                {statusFilters.length === 0
                  ? t('Choose one or more statuses above to filter virtual machines.')
                  : vms?.length
                    ? t('No virtual machines match your filters.')
                    : t('No virtual machines yet. Create one to get started.')}
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
