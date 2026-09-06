import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { useTranslation } from '../../../hooks/useTranslation';
import type { VmStorageRow } from '../../catalogProvision/wizard/storageRows';

interface VmStorageCardProps {
  storageRows: VmStorageRow[];
}

const VmStorageCard = ({ storageRows }: VmStorageCardProps) => {
  const { t } = useTranslation();

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
