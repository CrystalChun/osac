import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, SearchInput } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import {
  resourceDisplayName,
  useCreateSecurityGroup,
  useSecurityGroups,
  useVirtualNetworks,
} from '../../api/v1/networking';
import { SecurityGroupCreateModal } from '../../components/networking/SecurityGroupCreateModal';
import { SecurityGroupStatusLabel } from '../../components/networking/SecurityGroupStatusLabel';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { SubtleContent } from '../../components/SubtleContent/SubtleContent';
import { useTranslation } from '../../hooks/useTranslation';

export const SecurityGroupsListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: securityGroups = [], isLoading, error } = useSecurityGroups();
  const { data: virtualNetworks = [] } = useVirtualNetworks();

  const createSecurityGroup = useCreateSecurityGroup();

  const filteredSGs = securityGroups.filter((sg) => {
    const name = sg.metadata?.name ?? '';
    return !search || name.toLowerCase().includes(search.toLowerCase());
  });

  const handleCreate = async (input: Parameters<typeof createSecurityGroup.mutateAsync>[0]) => {
    const result = await createSecurityGroup.mutateAsync(input);
    return result;
  };

  const handleNavigateToDetail = (id: string) => {
    setIsCreateModalOpen(false);
    navigate(`/networking/security-groups/${id}`);
  };

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
          <SearchInput
            placeholder={t('Search security groups by name…')}
            value={search}
            onChange={(_e, v) => setSearch(v)}
            onClear={() => setSearch('')}
            style={{ marginBottom: '1rem' }}
          />
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
                  <Th>{t('Virtual Network')}</Th>
                  <Th>{t('Inbound Rules')}</Th>
                  <Th>{t('Outbound Rules')}</Th>
                  <Th>{t('Status')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredSGs.map((sg) => {
                  const name = sg.metadata?.name ?? sg.id;
                  const vnId = sg.spec?.virtualNetwork ?? '';
                  const vn = virtualNetworks.find((v) => v.id === vnId);
                  const vnName = resourceDisplayName(vn?.metadata, vnId);
                  const ingressCount = sg.spec?.ingress?.length ?? 0;
                  const egressCount = sg.spec?.egress?.length ?? 0;

                  return (
                    <Tr key={sg.id}>
                      <Td dataLabel="Name">
                        <Button
                          variant="link"
                          isInline
                          onClick={() => navigate(`/networking/security-groups/${sg.id}`)}
                        >
                          {name}
                        </Button>
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
                      <Td dataLabel="Status">
                        <SecurityGroupStatusLabel state={sg.status?.state} />
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </ListPageBody>
      </ListPage>

      {isCreateModalOpen && (
        <SecurityGroupCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreate}
          onNavigate={handleNavigateToDetail}
        />
      )}
    </>
  );
};
