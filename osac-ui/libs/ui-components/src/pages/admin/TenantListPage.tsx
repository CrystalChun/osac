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

import { useTenants } from '@osac/ui-components/api/v1/private/tenant';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { Timestamp } from '@osac/ui-components/components/Primitives/Timestamp';
import { SubtleContent } from '@osac/ui-components/components/SubtleContent/SubtleContent';
import TenantActionsMenu from '@osac/ui-components/components/Tenant/TenantActionsMenu';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import TenantStatusLabel from '../../components/Tenant/TenantStatusLabel';

export const TenantListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: tenants = [], isLoading, error } = useTenants();

  const filteredTenants = useMemo(() => {
    if (!search) {
      return tenants;
    }
    const lowerSearch = search.toLowerCase();
    return tenants.filter((tenant) => {
      const name = tenant.metadata?.name ?? tenant.id;
      return name.toLowerCase().includes(lowerSearch);
    });
  }, [search, tenants]);

  return (
    <ListPage
      title={t('Tenants')}
      description={t('Manage tenants for this cloud platform.')}
      error={error}
      actions={
        <Button variant="primary" onClick={() => navigate('/admin/tenants/create')}>
          {t('Create tenant')}
        </Button>
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup>
              <ToolbarItem>
                <SearchInput
                  placeholder={t('Search tenants by name…')}
                  value={search}
                  onChange={(_e, v) => setSearch(v)}
                  onClear={() => setSearch('')}
                  aria-label={t('Search tenants')}
                />
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
        {filteredTenants.length === 0 ? (
          <SubtleContent component="p">
            {search
              ? t('No tenants match your search.')
              : t('No tenants yet. Register one to get started.')}
          </SubtleContent>
        ) : (
          <Table aria-label={t('Tenants')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Tenant')}</Th>
                <Th>{t('Status')}</Th>
                <Th>{t('Primary domain')}</Th>
                <Th>{t('Registered')}</Th>
                <Th aria-label={t('Actions')} />
              </Tr>
            </Thead>
            <Tbody>
              {filteredTenants.map((tenant) => (
                <Tr key={tenant.id}>
                  <Td dataLabel={t('Tenant')}>
                    <Button variant="link" isInline onClick={() => {}}>
                      {tenant.metadata?.name || tenant.id}
                    </Button>
                  </Td>
                  <Td dataLabel={t('Status')}>
                    <TenantStatusLabel state={tenant.status?.state} />
                  </Td>
                  <Td dataLabel={t('Primary domain')}>{tenant.spec?.domains?.[0] ?? '—'}</Td>
                  <Td dataLabel={t('Registered')}>
                    <Timestamp value={tenant.metadata?.creationTimestamp} />
                  </Td>
                  <Td dataLabel={t('Actions')} isActionCell>
                    <TenantActionsMenu tenant={tenant} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </ListPageBody>
    </ListPage>
  );
};
