import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { BackendAssociation, StorageBackend } from '@osac/types/private';

import { protocolLabel } from './storageTierBackendResolution';
import { useTranslation } from '../../hooks/useTranslation';

interface StorageTierBackendAssociationsTableProps {
  backends: BackendAssociation[];
  backendsById: Map<string, StorageBackend>;
}

export const StorageTierBackendAssociationsTable = ({
  backends,
  backendsById,
}: StorageTierBackendAssociationsTableProps) => {
  const { t } = useTranslation();
  const protocolLabels = protocolLabel(t);

  return (
    <Table aria-label={t('Backend associations')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Backend')}</Th>
          <Th>{t('Protocol')}</Th>
          <Th>{t('Max read bandwidth')}</Th>
          <Th>{t('Max write bandwidth')}</Th>
          <Th>{t('Quota')}</Th>
          <Th>{t('Encryption')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {backends.map((association, index) => (
          <Tr key={`${association.backendId}-${index}`}>
            <Td dataLabel={t('Backend')}>
              {backendsById.get(association.backendId)?.metadata?.name ?? association.backendId}
            </Td>
            <Td dataLabel={t('Protocol')}>{protocolLabels[association.protocol]}</Td>
            <Td dataLabel={t('Max read bandwidth')}>{`${association.maxReadBandwidthMbs} MB/s`}</Td>
            <Td
              dataLabel={t('Max write bandwidth')}
            >{`${association.maxWriteBandwidthMbs} MB/s`}</Td>
            <Td dataLabel={t('Quota')}>{`${association.quotaGib} GiB`}</Td>
            <Td dataLabel={t('Encryption')}>
              {association.encryptionEnabled ? t('Yes') : t('No')}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};
