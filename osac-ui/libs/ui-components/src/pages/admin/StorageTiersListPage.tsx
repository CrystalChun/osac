import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Flex, FlexItem, Stack, StackItem } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import type { TFunction } from 'i18next';

import type { StorageTier } from '@osac/types/private';
import { StorageProtocol } from '@osac/types/private';

import {
  storageBackendIdsFilter,
  usePrivateStorageBackends,
} from '../../api/v1/private/storage-backends';
import { usePrivateStorageTiers } from '../../api/v1/private/storage-tiers';
import ListPageBody from '../../components/Page/ListPageBody';
import StorageTierActionsMenu from '../../components/Storage/StorageTierActionsMenu';
import { StorageTierStatusLabel } from '../../components/Storage/StorageTierStatusLabel';
import { SubtleContent } from '../../components/SubtleContent/SubtleContent';
import { useTranslation } from '../../hooks/useTranslation';

const protocolLabel = (t: TFunction, protocol: StorageProtocol): string => {
  switch (protocol) {
    case StorageProtocol.NFS:
      return t('NFS');
    case StorageProtocol.BLOCK:
      return t('Block');
    default:
      return '—';
  }
};

const uniqueBackendIds = (tiers: StorageTier[]): string[] => {
  const ids = new Set<string>();
  tiers.forEach((tier) => {
    tier.spec?.backends.forEach((backend) => ids.add(backend.backendId));
  });
  return Array.from(ids).sort();
};

export const StorageTiersListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: tiers = [], isLoading, error } = usePrivateStorageTiers();

  const backendIds = useMemo(() => uniqueBackendIds(tiers), [tiers]);

  const { data: backends = [], error: backendsError } = usePrivateStorageBackends(
    { filter: storageBackendIdsFilter(backendIds) },
    { enabled: backendIds.length > 0 },
  );

  const backendsById = useMemo(
    () => new Map(backends.map((backend) => [backend.id, backend])),
    [backends],
  );

  return (
    <Stack hasGutter>
      <StackItem>
        <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
          <FlexItem>
            <Button variant="primary" onClick={() => navigate('/admin/storage/tiers/create')}>
              {t('Create tier')}
            </Button>
          </FlexItem>
        </Flex>
      </StackItem>
      <StackItem>
        <ListPageBody isLoading={isLoading} error={error}>
          <Stack hasGutter>
            {Boolean(backendsError) && (
              <StackItem>
                <Alert variant="warning" isInline title={t('Unable to resolve backend names')}>
                  {t(
                    'Backend IDs are shown in place of names until this recovers. This is separate from the normal fallback shown when a tier references a backend that no longer exists.',
                  )}
                </Alert>
              </StackItem>
            )}
            <StackItem>
              {tiers.length === 0 ? (
                <SubtleContent component="p">
                  {t('No storage tiers yet. Create one to get started.')}
                </SubtleContent>
              ) : (
                <Table aria-label={t('Storage tiers')} variant="compact">
                  <Thead>
                    <Tr>
                      <Th>{t('Name')}</Th>
                      <Th>{t('Status')}</Th>
                      <Th>{t('Backends')}</Th>
                      <Th>{t('Protocol(s)')}</Th>
                      <Th aria-label={t('Actions')} />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {tiers.map((tier) => {
                      const backendAssociations = tier.spec?.backends ?? [];
                      return (
                        <Tr key={tier.id}>
                          <Td dataLabel={t('Name')}>{tier.metadata?.name || tier.id}</Td>
                          <Td dataLabel={t('Status')}>
                            <StorageTierStatusLabel state={tier.status?.state} />
                          </Td>
                          <Td dataLabel={t('Backends')}>
                            {backendAssociations
                              .map(
                                (association) =>
                                  backendsById.get(association.backendId)?.metadata?.name ??
                                  association.backendId,
                              )
                              .join(', ')}
                          </Td>
                          <Td dataLabel={t('Protocol(s)')}>
                            {backendAssociations
                              .map((association) => protocolLabel(t, association.protocol))
                              .join(', ')}
                          </Td>
                          <Td dataLabel={t('Actions')} isActionCell>
                            <StorageTierActionsMenu tier={tier} />
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              )}
            </StackItem>
          </Stack>
        </ListPageBody>
      </StackItem>
    </Stack>
  );
};
