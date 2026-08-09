import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { StorageBackend } from '@osac/types/private';

import StorageBackendActionsMenu from './StorageBackendActionsMenu';
import StorageBackendStateLabel from './StorageBackendStateLabel';
import { useTranslation } from '../../hooks/useTranslation';

interface StorageBackendsTableProps {
  backends: StorageBackend[];
}

export const StorageBackendsTable = ({ backends }: StorageBackendsTableProps) => {
  const { t } = useTranslation();

  return (
    <Table aria-label={t('Storage backends')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Provider')}</Th>
          <Th>{t('Endpoint')}</Th>
          <Th>{t('State')}</Th>
          <Th aria-label={t('Actions')} />
        </Tr>
      </Thead>
      <Tbody>
        {backends.map((backend) => (
          <Tr key={backend.id}>
            <Td dataLabel={t('Name')}>{backend.metadata?.name || backend.id}</Td>
            <Td dataLabel={t('Provider')}>{backend.spec?.provider}</Td>
            <Td dataLabel={t('Endpoint')}>{backend.spec?.endpoint}</Td>
            <Td dataLabel={t('State')}>
              <StorageBackendStateLabel state={backend.status?.state} />
            </Td>
            <Td dataLabel={t('Actions')} isActionCell>
              <StorageBackendActionsMenu backend={backend} />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};
