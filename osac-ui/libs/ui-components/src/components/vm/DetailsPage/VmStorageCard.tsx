import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ComputeInstance } from '@osac/types';

import { useVmDetailsDisplay } from './useVmDetailsDisplay';
import { useTranslation } from '../../../hooks/useTranslation';
import { formatBootDiskSizeForReview } from '../../catalogProvision/wizard/catalogOverlay';

interface VmStorageCardProps {
  vm: ComputeInstance;
}

const VmStorageCard = ({ vm }: VmStorageCardProps) => {
  const { t } = useTranslation();
  const { bootDiskTierDisplay, additionalDiskRows } = useVmDetailsDisplay(vm);
  const storageRows = [
    {
      name: t('Boot disk'),
      size: formatBootDiskSizeForReview(vm.spec?.bootDisk?.sizeGib),
      storageTier: bootDiskTierDisplay,
    },
    ...additionalDiskRows.map((disk, index) => ({
      name: t('Additional disk {{number}}', { number: index + 1 }),
      size: formatBootDiskSizeForReview(disk.sizeGib),
      storageTier: disk.tierDisplay,
    })),
  ];

  return (
    <Card isFullHeight>
      <CardTitle>{t('Storage')}</CardTitle>
      <CardBody>
        <Table aria-label={t('Storage')} variant="compact">
          <Thead>
            <Tr>
              <Th>{t('Name')}</Th>
              <Th>{t('Size')}</Th>
              <Th>{t('Storage tier')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {storageRows.map((row) => (
              <Tr key={row.name}>
                <Td dataLabel={t('Name')}>{row.name}</Td>
                <Td dataLabel={t('Size')}>{row.size}</Td>
                <Td dataLabel={t('Storage tier')}>{row.storageTier}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
};

export default VmStorageCard;
