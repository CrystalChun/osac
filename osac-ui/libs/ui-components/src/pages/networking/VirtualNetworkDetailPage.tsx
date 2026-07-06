import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
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
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
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
      <ListPage
        title={vnName}
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbItem>
              <Button
                variant="link"
                isInline
                onClick={() => navigate('/networking/virtual-networks')}
              >
                {t('Virtual networks')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{vnName}</BreadcrumbItem>
          </Breadcrumb>
        }
      >
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

          <Card style={{ marginBottom: '1rem' }}>
            <CardTitle>{t('Details')}</CardTitle>
            <CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('CIDR')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {vn?.spec?.ipv4Cidr && vn?.spec?.ipv6Cidr
                      ? `${vn.spec.ipv4Cidr}, ${vn.spec.ipv6Cidr}`
                      : vn?.spec?.ipv4Cidr || vn?.spec?.ipv6Cidr || '—'}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <VirtualNetworkStatusLabel state={vn?.status?.state} />
                  </DescriptionListDescription>
                </DescriptionListGroup>

                {vn?.status?.message && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Message')}</DescriptionListTerm>
                    <DescriptionListDescription>{vn.status.message}</DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </DescriptionList>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              actions={{
                actions: (
                  <Button variant="primary" onClick={() => setIsSubnetModalOpen(true)}>
                    {t('Create subnet')}
                  </Button>
                ),
              }}
            >
              <CardTitle>{t('Subnets')}</CardTitle>
            </CardHeader>
            <CardBody>
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
                    {subnets.map((subnet) => {
                      const ipv4Cidr = subnet.spec?.ipv4Cidr;
                      const ipv6Cidr = subnet.spec?.ipv6Cidr;
                      const cidr =
                        ipv4Cidr && ipv6Cidr
                          ? `${ipv4Cidr}, ${ipv6Cidr}`
                          : ipv4Cidr || ipv6Cidr || '—';

                      return (
                        <Tr key={subnet.id}>
                          <Td dataLabel="Name">{subnet.metadata?.name ?? subnet.id}</Td>
                          <Td dataLabel="CIDR">{cidr}</Td>
                          <Td dataLabel="Status">
                            <SubnetStatusLabel state={subnet.status?.state} />
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              )}
            </CardBody>
          </Card>
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
