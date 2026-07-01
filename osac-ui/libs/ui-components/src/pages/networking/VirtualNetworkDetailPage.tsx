import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, Tab, TabTitleText, Tabs } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { VirtualNetworkState } from '@osac/types';

import {
  useCreateSubnet,
  useSubnets,
  useVirtualNetwork,
  virtualNetworkFilterForSubnetList,
} from '../../api/v1/networking';
import { SubnetCreateModal } from '../../components/networking/SubnetCreateModal';
import { SubnetStatusLabel } from '../../components/networking/SubnetStatusLabel';
import { VirtualNetworkStatusLabel } from '../../components/networking/VirtualNetworkStatusLabel';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { SubtleContent } from '../../components/SubtleContent/SubtleContent';
import { useTranslation } from '../../hooks/useTranslation';

export const VirtualNetworkDetailPage = () => {
  const { t } = useTranslation();
  const { id = '' } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string | number>(0);
  const [isSubnetModalOpen, setIsSubnetModalOpen] = useState(false);

  const { data: vn, isLoading, error } = useVirtualNetwork(id);
  const { data: subnets = [] } = useSubnets({
    filter: virtualNetworkFilterForSubnetList(id),
  });

  const createSubnet = useCreateSubnet();

  const handleCreateSubnet = async (input: Parameters<typeof createSubnet.mutateAsync>[0]) => {
    const result = await createSubnet.mutateAsync(input);
    setIsSubnetModalOpen(false);
    return result;
  };

  const vnName = vn?.metadata?.name ?? id;
  const isFailed = vn?.status?.state === VirtualNetworkState.FAILED;

  return (
    <>
      <ListPage title={vnName}>
        <ListPageBody isLoading={isLoading} error={error}>
          {isFailed && vn?.status?.message && (
            <Alert
              variant="danger"
              title={t('Provisioning failed')}
              isInline
              style={{ marginBottom: '1rem' }}
            >
              {vn.status.message}
            </Alert>
          )}

          <Tabs activeKey={activeTab} onSelect={(_e, key) => setActiveTab(key)}>
            <Tab eventKey={0} title={<TabTitleText>{t('Subnets')}</TabTitleText>}>
              <div style={{ padding: '1rem 0' }}>
                <Button
                  variant="secondary"
                  onClick={() => setIsSubnetModalOpen(true)}
                  style={{ marginBottom: '1rem' }}
                >
                  {t('Create subnet')}
                </Button>

                {subnets.length === 0 ? (
                  <SubtleContent component="p">
                    {t('No subnets yet. Create one to get started.')}
                  </SubtleContent>
                ) : (
                  <Table aria-label="Subnets" variant="compact" borders>
                    <Thead>
                      <Tr>
                        <Th>{t('Name')}</Th>
                        <Th>{t('CIDR')}</Th>
                        <Th>{t('Status')}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {subnets.map((subnet) => (
                        <Tr key={subnet.id}>
                          <Td dataLabel="Name">{subnet.metadata?.name ?? subnet.id}</Td>
                          <Td dataLabel="CIDR">{subnet.spec?.ipv4Cidr ?? '—'}</Td>
                          <Td dataLabel="Status">
                            <SubnetStatusLabel state={subnet.status?.state} />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </div>
            </Tab>

            <Tab eventKey={1} title={<TabTitleText>{t('Details')}</TabTitleText>}>
              <div style={{ padding: '1rem 0' }}>
                <dl>
                  <dt style={{ fontWeight: 'bold' }}>{t('IPv4 CIDR')}</dt>
                  <dd style={{ marginBottom: '1rem' }}>{vn?.spec?.ipv4Cidr ?? '—'}</dd>

                  {vn?.spec?.ipv6Cidr && (
                    <>
                      <dt style={{ fontWeight: 'bold' }}>{t('IPv6 CIDR')}</dt>
                      <dd style={{ marginBottom: '1rem' }}>{vn.spec.ipv6Cidr}</dd>
                    </>
                  )}

                  <dt style={{ fontWeight: 'bold' }}>{t('Status')}</dt>
                  <dd style={{ marginBottom: '1rem' }}>
                    <VirtualNetworkStatusLabel state={vn?.status?.state} />
                  </dd>

                  {vn?.status?.message && (
                    <>
                      <dt style={{ fontWeight: 'bold' }}>{t('Message')}</dt>
                      <dd>{vn.status.message}</dd>
                    </>
                  )}
                </dl>
              </div>
            </Tab>
          </Tabs>
        </ListPageBody>
      </ListPage>

      {isSubnetModalOpen && vn && (
        <SubnetCreateModal
          isOpen={isSubnetModalOpen}
          onClose={() => setIsSubnetModalOpen(false)}
          onCreate={handleCreateSubnet}
          parentVN={vn}
          existingSubnets={subnets}
        />
      )}
    </>
  );
};
