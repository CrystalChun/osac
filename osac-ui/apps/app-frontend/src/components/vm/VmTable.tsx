/**
 * flow: manage-virtual-machines
 * step: mvm_list_view
 */
import { useNavigate } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ComputeInstance } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';
import { VmStatusLabel } from '@osac/ui-components/VmStatusLabel';

import { VmActionsMenu } from './VmActionsMenu';

import './VmTable.css';

interface VmTableProps {
  vms: ComputeInstance[];
}

export const VmTable = ({ vms }: VmTableProps) => {
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
            const state = vm.status?.state;
            const locked = state === ComputeInstanceState.DELETING;
            const name = vm.metadata?.name ?? vm.id;
            const cores = vm.spec?.cores;
            const memoryGib = vm.spec?.memoryGib;
            const ip = vm.status?.publicIpAddress || vm.status?.internalIpAddress;

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
                <Td dataLabel="IP">{locked ? '—' : ip || '—'}</Td>
                <Td dataLabel="Actions" isActionCell>
                  {locked ? null : <VmActionsMenu vm={vm} />}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </div>
  );
};
