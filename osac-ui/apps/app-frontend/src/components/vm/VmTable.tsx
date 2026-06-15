/**
 * flow: manage-virtual-machines
 * step: mvm_list_view
 */
import { useNavigate } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { COMPUTE_INSTANCE_STATE, type DisplayVmState } from '@osac/ui-components/vmDisplayState';
import { VmStatusLabel } from '@osac/ui-components/VmStatusLabel';

import { VmActionsMenu } from './VmActionsMenu';
import type { VmRow } from '../../api/vmRow';

import './VmTable.css';

type JsonRecord = Record<string, unknown>;

const jsonField = (obj: unknown, ...keys: string[]): unknown => {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  const rec = obj as JsonRecord;
  for (const k of keys) {
    if (k in rec && rec[k] != null) {
      return rec[k];
    }
  }
  return undefined;
};

const jsonNum = (obj: unknown, ...keys: string[]): number | undefined => {
  const v = jsonField(obj, ...keys);
  return typeof v === 'number' && !Number.isNaN(v) ? v : undefined;
};

const jsonStr = (obj: unknown, ...keys: string[]): string | undefined => {
  const v = jsonField(obj, ...keys);
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
};

interface VmTableProps {
  vms: VmRow[];
  getState: (vm: VmRow) => DisplayVmState;
  onPower: (vm: VmRow, action: 'start' | 'stop' | 'restart') => void;
  isRestarting?: (vm: VmRow) => boolean;
  isPowerActionPending?: (vm: VmRow) => boolean;
  onDelete?: (vm: VmRow) => void;
  /* RESTORE when fulfillment supports clone: onClone?: (vm: VmRow) => void */
}

export const VmTable = ({
  vms,
  getState,
  onPower,
  isRestarting,
  isPowerActionPending,
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
            const locked = state === COMPUTE_INSTANCE_STATE.DELETING;
            const name = vm.metadata?.name ?? vm.id;
            const cores = jsonNum(vm.spec, 'cores');
            const memoryGib = jsonNum(vm.spec, 'memory_gib', 'memoryGib');
            const ip =
              jsonStr(vm.status, 'public_ip_address', 'publicIpAddress', 'ipAddress') ??
              jsonStr(vm.status, 'internal_ip_address', 'internalIpAddress');
            return (
              <Tr key={vm.id}>
                <Td dataLabel="Name">
                  {locked ? (
                    name
                  ) : (
                    <Button
                      variant="link"
                      isInline
                      className="osac-vm-table__name-link"
                      onClick={() => navigate(`/vms/${vm.id}`)}
                    >
                      {name}
                    </Button>
                  )}
                </Td>
                <Td dataLabel="Status">
                  <VmStatusLabel state={state} />
                </Td>
                <Td dataLabel="vCPU">{cores ?? '—'}</Td>
                <Td dataLabel="Memory">{memoryGib != null ? `${memoryGib} GiB` : '—'}</Td>
                <Td dataLabel="IP">{locked ? '—' : (ip ?? '—')}</Td>
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
