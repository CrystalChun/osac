import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, SearchInput } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { useCreateVirtualNetwork, useSubnets, useVirtualNetworks } from '../../api/v1/networking';
import { VirtualNetworkCreateModal } from '../../components/networking/VirtualNetworkCreateModal';
import { VirtualNetworkStatusLabel } from '../../components/networking/VirtualNetworkStatusLabel';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { SubtleContent } from '../../components/SubtleContent/SubtleContent';
import { useTranslation } from '../../hooks/useTranslation';

export const VirtualNetworksListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: virtualNetworks = [], isLoading, error } = useVirtualNetworks();
  const { data: allSubnets = [] } = useSubnets();

  const createVirtualNetwork = useCreateVirtualNetwork();

  // Count subnets per VN
  const subnetCountByVN = allSubnets.reduce(
    (acc, subnet) => {
      const vnId = subnet.spec?.virtualNetwork;
      if (vnId) {
        acc[vnId] = (acc[vnId] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const filteredVNs = virtualNetworks.filter((vn) => {
    const name = vn.metadata?.name ?? '';
    return !search || name.toLowerCase().includes(search.toLowerCase());
  });

  const handleCreate = async (input: Parameters<typeof createVirtualNetwork.mutateAsync>[0]) => {
    const result = await createVirtualNetwork.mutateAsync(input);
    return result;
  };

  const handleNavigateToDetail = (id: string) => {
    setIsCreateModalOpen(false);
    navigate(`/networking/virtual-networks/${id}`);
  };

  return (
    <>
      <ListPage
        title={t('Virtual networks')}
        description={t('Manage virtual networks for your compute instances.')}
        actions={
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            {t('Create virtual network')}
          </Button>
        }
      >
        <ListPageBody isLoading={isLoading} error={error}>
          <SearchInput
            placeholder={t('Search virtual networks by name…')}
            value={search}
            onChange={(_e, v) => setSearch(v)}
            onClear={() => setSearch('')}
            style={{ marginBottom: '1rem' }}
          />
          {filteredVNs.length === 0 ? (
            <SubtleContent component="p">
              {search
                ? t('No virtual networks match your search.')
                : t('No virtual networks yet. Create one to get started.')}
            </SubtleContent>
          ) : (
            <Table aria-label="Virtual networks" variant="compact" borders>
              <Thead>
                <Tr>
                  <Th>{t('Name')}</Th>
                  <Th>{t('IPv4 CIDR')}</Th>
                  <Th>{t('Subnets')}</Th>
                  <Th>{t('Status')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredVNs.map((vn) => {
                  const name = vn.metadata?.name ?? vn.id;
                  const ipv4Cidr = vn.spec?.ipv4Cidr ?? '—';
                  const subnetCount = subnetCountByVN[vn.id] || 0;

                  return (
                    <Tr key={vn.id}>
                      <Td dataLabel="Name">
                        <Button
                          variant="link"
                          isInline
                          onClick={() => navigate(`/networking/virtual-networks/${vn.id}`)}
                        >
                          {name}
                        </Button>
                      </Td>
                      <Td dataLabel="IPv4 CIDR">{ipv4Cidr}</Td>
                      <Td dataLabel="Subnets">{subnetCount}</Td>
                      <Td dataLabel="Status">
                        <VirtualNetworkStatusLabel state={vn.status?.state} />
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
        <VirtualNetworkCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreate}
          onNavigate={handleNavigateToDetail}
        />
      )}
    </>
  );
};
