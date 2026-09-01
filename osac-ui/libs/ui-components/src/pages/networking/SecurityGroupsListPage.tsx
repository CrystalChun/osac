import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import ResourceNameField from '@osac/ui-components/components/Resource/ResourceNameField.tsx';

import {
  resourceDisplayName,
  useSecurityGroups,
  useVirtualNetworks,
} from '../../api/v1/networking';
import { SecurityGroupCreateModal } from '../../components/networking/SecurityGroupCreateModal';
import { SecurityGroupStatusLabel } from '../../components/networking/SecurityGroupStatusLabel';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { SubtleContent } from '../../components/SubtleContent/SubtleContent';
import { useTranslation } from '../../hooks/useTranslation';

const SEARCH_PARAM = 'search';

export const SecurityGroupsListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const search = searchParams.get(SEARCH_PARAM) ?? '';

  const { data: securityGroups = [], isLoading, error } = useSecurityGroups();
  const { data: virtualNetworks = [] } = useVirtualNetworks();

  const setSearch = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!value.trim()) {
          next.delete(SEARCH_PARAM);
        } else {
          next.set(SEARCH_PARAM, value);
        }
        return next;
      },
      { replace: true },
    );
  };

  const filteredSGs = securityGroups.filter((sg) => {
    const name = sg.metadata?.name ?? '';
    return !search || name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <>
      <ListPage
        title={t('Security groups')}
        description={t('Manage firewall rules for your virtual networks.')}
        actions={
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            {t('Create security group')}
          </Button>
        }
      >
        <ListPageBody isLoading={isLoading} error={error}>
          <Toolbar>
            <ToolbarContent>
              <ToolbarGroup>
                <ToolbarItem>
                  <SearchInput
                    placeholder={t('Search security groups by name…')}
                    value={search}
                    onChange={(_e, v) => setSearch(v)}
                    onClear={() => setSearch('')}
                  />
                </ToolbarItem>
              </ToolbarGroup>
            </ToolbarContent>
          </Toolbar>
          {filteredSGs.length === 0 ? (
            <SubtleContent component="p">
              {search
                ? t('No security groups match your search.')
                : t('No security groups yet. Create one to get started.')}
            </SubtleContent>
          ) : (
            <Table aria-label="Security groups" variant="compact" borders>
              <Thead>
                <Tr>
                  <Th>{t('Name')}</Th>
                  <Th>{t('Status')}</Th>
                  <Th>{t('Virtual Network')}</Th>
                  <Th>{t('Inbound Rules')}</Th>
                  <Th>{t('Outbound Rules')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredSGs.map((sg) => {
                  const vnId = sg.spec?.virtualNetwork?.id ?? '';
                  const vn = virtualNetworks.find((v) => v.id === vnId);
                  const vnName = resourceDisplayName(vn?.metadata, vnId);
                  const ingressCount = sg.spec?.ingress?.length ?? 0;
                  const egressCount = sg.spec?.egress?.length ?? 0;

                  return (
                    <Tr key={sg.id}>
                      <Td dataLabel="Name">
                        <ResourceNameField
                          resource={sg}
                          detailsUrl={`/networking/security-groups/${sg.id}`}
                        />
                      </Td>
                      <Td dataLabel="Status">
                        <SecurityGroupStatusLabel state={sg.status?.state} />
                      </Td>
                      <Td dataLabel="Virtual Network">
                        {vnId ? (
                          <Button
                            variant="link"
                            isInline
                            onClick={() => navigate(`/networking/virtual-networks/${vnId}`)}
                          >
                            {vnName}
                          </Button>
                        ) : (
                          vnName
                        )}
                      </Td>
                      <Td dataLabel="Inbound Rules">{ingressCount}</Td>
                      <Td dataLabel="Outbound Rules">{egressCount}</Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </ListPageBody>
      </ListPage>

      {isCreateModalOpen && (
        <SecurityGroupCreateModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </>
  );
};
