import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { useBareMetalInstances } from '@osac/ui-components/api/v1/baremetal-instance';
import { BareMetalActionsMenu } from '@osac/ui-components/components/BareMetalInstance/BareMetalActionsMenu';
import { BareMetalStatusLabel } from '@osac/ui-components/components/BareMetalInstance/BareMetalStatusLabel';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { Timestamp } from '@osac/ui-components/components/Primitives/Timestamp';
import { SubtleContent } from '@osac/ui-components/components/SubtleContent/SubtleContent';
import { useSession } from '@osac/ui-components/hooks/use-session';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

export const BareMetalListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useSession();
  const [search, setSearch] = useState('');

  const { data: instances = [], isLoading, error } = useBareMetalInstances();

  const filteredInstances = useMemo(() => {
    if (!search) {
      return instances;
    }
    const lc = search.toLowerCase();
    return instances.filter((inst) => (inst.metadata?.name ?? inst.id).toLowerCase().includes(lc));
  }, [search, instances]);

  return (
    <ListPage
      title={t('Bare Metal')}
      description={t('View and manage your bare metal instances.')}
      error={error}
      actions={
        role === 'tenantUser' ? (
          <Button variant="primary" onClick={() => navigate('/bare-metal/create')}>
            {t('Provision bare metal')}
          </Button>
        ) : undefined
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup>
              <ToolbarItem>
                <SearchInput
                  placeholder={t('Search by name')}
                  value={search}
                  onChange={(_e, v) => setSearch(v)}
                  onClear={() => setSearch('')}
                  aria-label={t('Filter bare metal instances by name')}
                />
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
        {filteredInstances.length === 0 ? (
          <SubtleContent component="p">
            {search
              ? t('No bare metal instances match your search.')
              : t('No bare metal instances yet.')}
          </SubtleContent>
        ) : (
          <Table aria-label={t('Bare metal instances')} variant="compact" borders>
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Catalog item')}</Th>
                <Th>{t('Status')}</Th>
                <Th>{t('Created')}</Th>
                <Th aria-label={t('Actions')} />
              </Tr>
            </Thead>
            <Tbody>
              {filteredInstances.map((inst) => {
                const name = inst.metadata?.name ?? inst.id;
                return (
                  <Tr key={inst.id}>
                    <Td dataLabel={t('Name')}>
                      <Button
                        variant="link"
                        isInline
                        onClick={() => navigate(`/bare-metal/${inst.id}`)}
                      >
                        {name}
                      </Button>
                    </Td>
                    <Td dataLabel={t('Catalog item')}>{inst.spec?.catalogItem ?? '—'}</Td>
                    <Td dataLabel={t('Status')}>
                      <BareMetalStatusLabel state={inst.status?.state} />
                    </Td>
                    <Td dataLabel={t('Created')}>
                      <Timestamp value={inst.metadata?.creationTimestamp} />
                    </Td>
                    <Td dataLabel={t('Actions')} isActionCell>
                      <BareMetalActionsMenu instance={inst} />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </ListPageBody>
    </ListPage>
  );
};
