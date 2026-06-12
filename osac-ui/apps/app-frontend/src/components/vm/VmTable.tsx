/**
 * flow: manage-virtual-machines
 * step: mvm_list_view
 */
import { Button } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useNavigate } from 'react-router-dom';

import type { ComputeInstance, VmPowerState } from '@osac/api-contracts/types';
import { VmStatusLabel } from '@osac/ui-components/VmStatusLabel';
import { VmActionsMenu } from './VmActionsMenu';

import './VmTable.css';

interface VmTableProps {
  vms: ComputeInstance[];
  getState: (vm: ComputeInstance) => VmPowerState;
  onPower: (vm: ComputeInstance, action: 'start' | 'stop' | 'restart') => void;
  isRestarting?: (vm: ComputeInstance) => boolean;
  isPowerActionPending?: (vm: ComputeInstance) => boolean;
  isPendingCreation?: (vm: ComputeInstance) => boolean;
  onDelete?: (vm: ComputeInstance) => void;
  /* RESTORE when fulfillment supports clone: onClone?: (vm: ComputeInstance) => void */
}

export const VmTable = ({
  vms,
  getState,
  onPower,
  isRestarting,
  isPowerActionPending,
  isPendingCreation,
  onDelete,
}: VmTableProps) => {
  const navigate = useNavigate();
  return (
    <div className="osac-vm-table-shell">
      <Table aria-label="Virtual machines" variant="compact" borders className="osac-vm-table">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Status</Th>
            <Th>vCPU</Th>
            <Th>Memory</Th>
            <Th>IP</Th>
            <Th aria-label="Actions" />
          </Tr>
        </Thead>
        <Tbody>
          {vms.map((vm) => {
            const state = getState(vm);
            const pending = isPendingCreation?.(vm) ?? false;
            const locked = pending || state === 'deleting';
            return (
              <Tr key={vm.id}>
                <Td dataLabel="Name">
                  {locked ? (
                    vm.metadata.name
                  ) : (
                    <Button
                      variant="link"
                      isInline
                      className="osac-vm-table__name-link"
                      onClick={() => navigate(`/vms/${vm.id}`)}
                    >
                      {vm.metadata.name}
                    </Button>
                  )}
                </Td>
                <Td dataLabel="Status">
                  <VmStatusLabel state={state} />
                </Td>
                <Td dataLabel="vCPU">{vm.spec.cores ?? '—'}</Td>
                <Td dataLabel="Memory">
                  {vm.spec.memoryGib != null ? `${vm.spec.memoryGib} GiB` : '—'}
                </Td>
                <Td dataLabel="IP">{locked ? '—' : (vm.status.ipAddress ?? '—')}</Td>
                <Td dataLabel="Actions" isActionCell>
                  {locked ? null : (
                    <VmActionsMenu
                      vm={vm}
                      effectiveState={state}
                      isRestarting={isRestarting?.(vm)}
                      isPowerActionPending={isPowerActionPending?.(vm)}
                      onPower={(a) => onPower(vm, a)}
                      {...(onDelete ? { onDelete: () => onDelete(vm) } : {})}
                    />
                  )}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </div>
  );
};
