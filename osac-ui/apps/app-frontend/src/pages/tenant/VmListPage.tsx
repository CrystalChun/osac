import { BarsIcon } from '@patternfly/react-icons/dist/esm/icons/bars-icon';
import { ThLargeIcon } from '@patternfly/react-icons/dist/esm/icons/th-large-icon';
/**
 * flow: manage-virtual-machines
 * steps: mvm_list_view, mvm_detail_drawer
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bullseye,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Divider,
  Flex,
  FlexItem,
  FormSelect,
  FormSelectOption,
  Gallery,
  GalleryItem,
  PageSection,
  SearchInput,
  Spinner,
  Stack,
  StackItem,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import type { ComputeInstance, VmPowerState } from '@osac/api-contracts/types';
import {
  formatVmStorageGiBLine,
  resolveVmOsForUi,
} from '@osac/api-contracts/computeInstanceNormalize';
import { VmStatusLabel } from '@osac/ui-components/VmStatusLabel';
import { GuestOsIcon } from '../../components/shared/GuestOsIcon';
import { useSession } from '../../contexts/SessionContext';
import {
  refetchComputeInstancesQueries,
  useComputeInstances,
  useDeleteVm,
  usePatchVm,
  useProvisionVm,
} from '../../api/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { listPostCreateWatchIds } from '../../api/postCreateWatchStore';
import { isPendingVmClientId } from '../../api/pendingVmCreation';
import { pinProvisioningVmsToListEnd } from '../../api/vmListDisplayOrder';
import { usePendingVmCreations } from '../../api/usePendingVmCreations';
import { usePendingVmDeletes } from '../../api/usePendingVmDeletes';
import { useVmPowerActionDisplay } from '../../api/useVmPowerActionDisplay';
import { VmDeleteConfirmModal } from '../../components/vm/VmDeleteConfirmModal';
import { PageHeader } from '../../components/layout/PageHeader';
import '../../components/dashboard/DashboardVmStatCard.css';
import '../../components/shared/DetailField.css';
import './VmListPage.css';
import { VmDetailDrawer } from '../../components/vm/VmDetailDrawer';
import type { CreateVmWizardHandle, DeploymentMode } from '../../components/vm/CreateVmWizard';
import { CreateVmWizard } from '../../components/vm/CreateVmWizard';
import { VmActionsMenu } from '../../components/vm/VmActionsMenu';
import { VmTable } from '../../components/vm/VmTable';

type ListMode = 'cards' | 'table';
type VmPowerFilter = VmPowerState | 'all';
type VmOsFilter = 'all' | 'linux' | 'rhel' | 'windows';

const ALLOWED_POWER_FILTERS: readonly VmPowerFilter[] = ['all', 'running', 'stopped', 'paused'];

const normalizePowerFilter = (value: string | null): VmPowerFilter => {
  if (!value) {
    return 'all';
  }
  return ALLOWED_POWER_FILTERS.includes(value as VmPowerFilter) ? (value as VmPowerFilter) : 'all';
};

const VmInlineDetailField = ({ label, value }: { label: string; value: string }) => {
  return (
    <Content component="p" className="osac-inline-detail-field">
      <span className="osac-inline-detail-field__label">{label}</span>
      <span className="osac-inline-detail-field__value">{value}</span>
    </Content>
  );
};

const VmDetailField = ({ label, value }: { label: string; value: string }) => {
  return (
    <Stack hasGutter={false}>
      <StackItem>
        <Content component="small" className="osac-detail-field__label">
          {label}
        </Content>
      </StackItem>
      <StackItem>
        <Content component="p" className="osac-detail-field__value">
          {value}
        </Content>
      </StackItem>
    </Stack>
  );
};

export const VmListPage = () => {
  const { role, topologyDetailRequest, clearTopologyDetailRequest } = useSession();
  const [searchParams] = useSearchParams();
  const wizardRef = useRef<CreateVmWizardHandle>(null);

  const [search, setSearch] = useState('');
  const [listMode, setListMode] = useState<ListMode>('cards');
  const [powerFilter, setPowerFilter] = useState<VmPowerFilter>(() =>
    normalizePowerFilter(searchParams.get('power')),
  );
  const [osFilter, setOsFilter] = useState<VmOsFilter>('all');
  const [selectedVm, setSelectedVm] = useState<ComputeInstance | null>(null);
  const [vmToDelete, setVmToDelete] = useState<ComputeInstance | null>(null);

  const queryClient = useQueryClient();
  const { data: vms = [], isLoading } = useComputeInstances();
  const provisionVm = useProvisionVm();
  const patchVm = usePatchVm();
  const deleteVm = useDeleteVm();
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
  const { markPendingDelete, clearPendingDelete, isPendingDelete } = usePendingVmDeletes(vms);

  const handleWizardProvision = useCallback(
    async (vm: Partial<ComputeInstance>, meta: { mode: DeploymentMode }) => {
      const clientId = registerPending(vm);
      try {
        const created = await provisionVm.mutateAsync({
          vm,
          specCatalogItemOnly: meta.mode === 'template',
        });
        noteCreateSuccess(clientId, created.id);
      } catch {
        dismissPending(clientId);
        throw new Error('Provisioning failed');
      }
    },
    [dismissPending, noteCreateSuccess, provisionVm, registerPending],
  );

  const isPendingCreation = useCallback((vm: ComputeInstance) => isPendingVmClientId(vm.id), []);

  const getVmDisplayState = useCallback(
    (vm: ComputeInstance) => {
      if (isPendingDelete(vm.id)) {
        return 'deleting';
      }
      if (isPendingVmClientId(vm.id)) {
        return getCreationDisplayState(vm.id);
      }
      const postCreate = getPostCreateDisplayState(vm);
      if (postCreate) {
        return postCreate;
      }
      return getDisplayState(vm);
    },
    [getCreationDisplayState, getPostCreateDisplayState, getDisplayState, isPendingDelete],
  );

  useEffect(() => {
    if (!topologyDetailRequest) {
      return;
    }
    const vm = vms.find((v) => v.id === topologyDetailRequest.vmId);
    if (vm) {
      setSelectedVm(vm);
    }
    clearTopologyDetailRequest();
  }, [topologyDetailRequest, vms, clearTopologyDetailRequest]);

  useEffect(() => {
    setSelectedVm((current) => {
      if (!current) {
        return current;
      }
      return vms.find((v) => v.id === current.id) ?? null;
    });
  }, [vms]);

  const handlePowerAction = useCallback(
    (vm: ComputeInstance, action: 'start' | 'stop' | 'restart') => {
      runPowerAction(vm, action);
    },
    [runPowerAction],
  );

  const filteredVms = useMemo(() => {
    const pending = powerFilter === 'all' ? pendingInstances() : [];
    const merged = [...vms, ...pending];
    const filtered = merged.filter((vm) => {
      const matchesSearch =
        !search || vm.metadata.name.toLowerCase().includes(search.toLowerCase());
      const matchesOs = osFilter === 'all' || resolveVmOsForUi(vm) === osFilter;
      if (isPendingVmClientId(vm.id) || isPendingDelete(vm.id)) {
        return matchesSearch && matchesOs;
      }
      const state = getVmDisplayState(vm);
      const matchesPower = powerFilter === 'all' || state === powerFilter;
      return matchesSearch && matchesPower && matchesOs;
    });
    return pinProvisioningVmsToListEnd(filtered, listPostCreateWatchIds());
  }, [getVmDisplayState, isPendingDelete, osFilter, pendingInstances, powerFilter, search, vms]);

  const handleOpenCreateVm = useCallback(() => {
    wizardRef.current?.open();
  }, []);

  const handleRequestDelete = useCallback((vm: ComputeInstance) => {
    setVmToDelete(vm);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!vmToDelete) {
      return;
    }
    const id = vmToDelete.id;
    const live = vms.find((v) => v.id === id) ?? vmToDelete;
    const state = live.status.state;

    markPendingDelete(id);
    setVmToDelete(null);
    if (selectedVm?.id === id) {
      setSelectedVm(null);
    }

    const finishDelete = () => {
      deleteVm.mutate(id, {
        onError: () => {
          clearPendingDelete(id);
        },
      });
    };

    if (state === 'stopped') {
      finishDelete();
      return;
    }

    patchVm.mutate(
      { id, powerAction: 'stop' },
      {
        onSuccess: () => finishDelete(),
        onError: () => {
          clearPendingDelete(id);
        },
      },
    );
  }, [clearPendingDelete, deleteVm, markPendingDelete, patchVm, selectedVm?.id, vmToDelete, vms]);

  const vmToDeleteLive = vmToDelete
    ? (vms.find((v) => v.id === vmToDelete.id) ?? vmToDelete)
    : null;
  const deleteWillStopFirst = vmToDeleteLive != null && vmToDeleteLive.status.state !== 'stopped';
  const deleteBusy = deleteVm.isPending || patchVm.isPending;

  const detailState = selectedVm ? getVmDisplayState(selectedVm) : 'stopped';

  return (
    <PageSection isFilled>
      <VmDeleteConfirmModal
        vm={vmToDelete}
        isOpen={vmToDelete != null}
        isPending={deleteBusy}
        willStopFirst={deleteWillStopFirst}
        errorMessage={
          patchVm.isError || deleteVm.isError
            ? (patchVm.error ?? deleteVm.error) instanceof Error
              ? ((patchVm.error ?? deleteVm.error) as Error).message
              : 'Request failed'
            : null
        }
        onClose={() => {
          if (!deleteBusy) {
            setVmToDelete(null);
            deleteVm.reset();
            patchVm.reset();
          }
        }}
        onConfirm={handleConfirmDelete}
      />
      <CreateVmWizard ref={wizardRef} existingVms={vms} onProvision={handleWizardProvision} />

      {selectedVm ? (
        /* RESTORE clone when fulfillment supports it:
           onClone={() => wizardRef.current?.openFromClone(selectedVm.id)}
        */
        <VmDetailDrawer
          vm={selectedVm}
          effectiveState={detailState}
          onClose={() => setSelectedVm(null)}
          onPower={(action) => handlePowerAction(selectedVm, action)}
          onDelete={() => handleRequestDelete(selectedVm)}
          isRestarting={isRestarting(selectedVm.id)}
          isPowerActionPending={isPowerActionPending(selectedVm.id)}
        />
      ) : (
        <>
          <PageHeader
            title="My VMs"
            description="View and filter instances. Use the layout toggle for grid cards (same style as templates) or a compact table."
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

          <Flex
            justifyContent={{ default: 'justifyContentSpaceBetween' }}
            alignItems={{ default: 'alignItemsFlexStart', md: 'alignItemsCenter' }}
            flexWrap={{ default: 'wrap' }}
            gap={{ default: 'gapMd' }}
            className="osac-vm-list__toolbar"
          >
            <Flex
              spaceItems={{ default: 'spaceItemsSm' }}
              alignItems={{ default: 'alignItemsCenter' }}
              flexWrap={{ default: 'wrap' }}
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
                <FormSelect
                  id="vm-filter-status"
                  value={powerFilter}
                  onChange={(_e, v) => setPowerFilter(normalizePowerFilter(v))}
                  aria-label="Filter VMs by status"
                  className="osac-vm-list__filter"
                >
                  <FormSelectOption value="all" label="All statuses" />
                  <FormSelectOption value="running" label="Running" />
                  <FormSelectOption value="stopped" label="Stopped" />
                  <FormSelectOption value="paused" label="Paused" />
                </FormSelect>
              </FlexItem>
              <FlexItem>
                <FormSelect
                  id="vm-filter-os"
                  value={osFilter}
                  onChange={(_e, v) => setOsFilter(v as VmOsFilter)}
                  aria-label="Filter VMs by operating system"
                  className="osac-vm-list__filter"
                >
                  <FormSelectOption value="all" label="All operating systems" />
                  <FormSelectOption value="linux" label="Linux" />
                  <FormSelectOption value="rhel" label="RHEL" />
                  <FormSelectOption value="windows" label="Windows" />
                </FormSelect>
              </FlexItem>
            </Flex>
            <FlexItem>
              <ToggleGroup aria-label="List view mode" className="osac-view-toggle--compact">
                <ToggleGroupItem
                  text={<ThLargeIcon aria-hidden />}
                  buttonId="view-cards"
                  isSelected={listMode === 'cards'}
                  onChange={() => setListMode('cards')}
                  aria-label="Cards view"
                />
                <ToggleGroupItem
                  text={<BarsIcon aria-hidden />}
                  buttonId="view-table"
                  isSelected={listMode === 'table'}
                  onChange={() => setListMode('table')}
                  aria-label="Table view"
                />
              </ToggleGroup>
            </FlexItem>
          </Flex>

          {isLoading ? (
            <Bullseye className="osac-vm-list__loading">
              <Spinner aria-label="Loading virtual machines" />
            </Bullseye>
          ) : filteredVms.length === 0 ? (
            <Content component="p" className="osac-vm-list__empty">
              {search || powerFilter !== 'all' || osFilter !== 'all'
                ? 'No virtual machines match your filters.'
                : 'No virtual machines yet. Create one to get started.'}
            </Content>
          ) : listMode === 'cards' ? (
            <Gallery hasGutter className="osac-vm-card-grid" minWidths={{ default: '360px' }}>
              {filteredVms.map((vm) => {
                const state = getVmDisplayState(vm);
                const pendingCreate = isPendingCreation(vm);
                const pendingDelete = isPendingDelete(vm.id);
                const locked = pendingCreate || pendingDelete;
                const createdDate = vm.metadata.createdAt
                  ? new Date(vm.metadata.createdAt).toLocaleDateString()
                  : 'Not set';
                const ipAddress = locked ? '—' : vm.status.ipAddress || 'Not set';
                return (
                  <GalleryItem key={vm.id}>
                    <Card
                      isClickable={!locked}
                      className="osac-dashboard-vm-stat-card osac-vm-card"
                      onClick={locked ? undefined : () => setSelectedVm(vm)}
                    >
                      <CardHeader>
                        <Stack hasGutter className="osac-vm-card__header-stack">
                          <StackItem>
                            <Flex
                              alignItems={{ default: 'alignItemsCenter' }}
                              justifyContent={{ default: 'justifyContentSpaceBetween' }}
                            >
                              <FlexItem>
                                <GuestOsIcon os={resolveVmOsForUi(vm)} size="md" />
                              </FlexItem>
                              <FlexItem>
                                <Flex
                                  alignItems={{ default: 'alignItemsCenter' }}
                                  spaceItems={{ default: 'spaceItemsSm' }}
                                >
                                  <FlexItem>
                                    <VmStatusLabel state={state} />
                                  </FlexItem>
                                  {!locked ? (
                                    <FlexItem>
                                      {/* RESTORE clone: onClone={() => wizardRef.current?.openFromClone(vm.id)} */}
                                      <span
                                        onClick={(event) => event.stopPropagation()}
                                        onMouseDown={(event) => event.stopPropagation()}
                                        onKeyDown={(event) => event.stopPropagation()}
                                      >
                                        <VmActionsMenu
                                          vm={vm}
                                          effectiveState={state}
                                          isRestarting={isRestarting(vm.id)}
                                          isPowerActionPending={isPowerActionPending(vm.id)}
                                          onPower={(a) => handlePowerAction(vm, a)}
                                          onDelete={() => handleRequestDelete(vm)}
                                        />
                                      </span>
                                    </FlexItem>
                                  ) : null}
                                </Flex>
                              </FlexItem>
                            </Flex>
                          </StackItem>
                          <StackItem>
                            <CardTitle>{vm.metadata.name}</CardTitle>
                          </StackItem>
                        </Stack>
                      </CardHeader>
                      <CardBody>
                        {vm.description && (
                          <Content component="p" className="osac-vm-card__description">
                            {vm.description}
                          </Content>
                        )}
                        <Flex
                          gap={{ default: 'gapLg' }}
                          flexWrap={{ default: 'wrap' }}
                          className="osac-vm-card__specs-row"
                        >
                          <FlexItem>
                            <VmDetailField
                              label="CPU"
                              value={vm.spec.cores != null ? `${vm.spec.cores} vCPU` : '—'}
                            />
                          </FlexItem>
                          <FlexItem>
                            <VmDetailField
                              label="Memory"
                              value={vm.spec.memoryGib != null ? `${vm.spec.memoryGib} GiB` : '—'}
                            />
                          </FlexItem>
                          <FlexItem>
                            <VmDetailField
                              label="Storage"
                              value={formatVmStorageGiBLine(vm.spec)}
                            />
                          </FlexItem>
                        </Flex>
                        <Divider className="osac-vm-card__divider" />
                        <Stack hasGutter={false} className="osac-vm-card__meta-stack">
                          <StackItem>
                            <VmInlineDetailField label="IP address" value={ipAddress} />
                          </StackItem>
                          <StackItem>
                            <VmInlineDetailField label="Created" value={createdDate} />
                          </StackItem>
                        </Stack>
                      </CardBody>
                    </Card>
                  </GalleryItem>
                );
              })}
            </Gallery>
          ) : (
            /* RESTORE clone: onClone={(vm) => wizardRef.current?.openFromClone(vm.id)} */
            <VmTable
              vms={filteredVms}
              getState={getVmDisplayState}
              isPendingCreation={isPendingCreation}
              isRestarting={(vm) => isRestarting(vm.id)}
              isPowerActionPending={(vm) => isPowerActionPending(vm.id)}
              onSelect={setSelectedVm}
              onPower={handlePowerAction}
              onDelete={handleRequestDelete}
            />
          )}
        </>
      )}
    </PageSection>
  );
};
