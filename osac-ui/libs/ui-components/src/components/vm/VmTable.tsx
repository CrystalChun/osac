/**
 * flow: manage-virtual-machines
 * step: mvm_list_view
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ComputeInstance, InstanceType } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';

import { VmActionsMenu } from './VmActionsMenu';
import { VmInstanceTypeLabel } from './VmInstanceTypeLabel';
import { useTranslation } from '../../hooks/useTranslation';
import { VmStatusLabel } from '../../VmStatusLabel';

interface VmTableProps {
  vms: ComputeInstance[];
  instanceTypes?: InstanceType[];
  isInstanceTypesLoading?: boolean;
}

export const VmTable = ({
  vms,
  instanceTypes = [],
  isInstanceTypesLoading = false,
}: VmTableProps) => {
  const { t } = useTranslation();

  const instanceTypeById = useMemo(
    () => new Map(instanceTypes.map((item) => [item.id, item])),
    [instanceTypes],
  );

  return (
    <Table aria-label={t('Virtual machines')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('Instance type')}</Th>
          <Th>{t('Internal IP')}</Th>
          <Th>{t('External IP')}</Th>
          <Th aria-label={t('Actions')} />
        </Tr>
      </Thead>
      <Tbody>
        {vms.map((vm) => {
          const state = vm.status?.state;
          const locked = state === ComputeInstanceState.DELETING;
          const name = vm.metadata?.name ?? vm.id;
          const instanceTypeId = vm.spec?.instanceType;
          const internalIp = vm.status?.internalIpAddress;
          const externalIp = vm.status?.publicIpAddress;

          return (
            <Tr key={vm.id}>
              <Td dataLabel={t('Name')}>
                {locked ? name : <Link to={`/vms/${encodeURIComponent(vm.id)}`}>{name}</Link>}
              </Td>
              <Td dataLabel={t('Status')}>
                <VmStatusLabel state={state} />
              </Td>
              <Td dataLabel={t('Instance type')}>
                <VmInstanceTypeLabel
                  instanceTypeId={instanceTypeId}
                  instanceType={instanceTypeId ? instanceTypeById.get(instanceTypeId) : undefined}
                  isLoading={isInstanceTypesLoading}
                />
              </Td>
              <Td dataLabel={t('Internal IP')}>{locked ? '—' : internalIp || '—'}</Td>
              <Td dataLabel={t('External IP')}>{locked ? '—' : externalIp || '—'}</Td>
              <Td dataLabel={t('Actions')} isActionCell>
                {locked ? null : <VmActionsMenu vm={vm} />}
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
