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
  securityGroupFilterForVirtualNetwork,
  useCreateSecurityGroup,
  useCreateSubnet,
  useSecurityGroups,
  useSubnets,
  useVirtualNetwork,
  virtualNetworkFilterForSubnetList,
} from '../../api/v1/networking';
import { SecurityGroupCreateModal } from '../../components/networking/SecurityGroupCreateModal';
import { SecurityGroupStatusLabel } from '../../components/networking/SecurityGroupStatusLabel';
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
  const [isSecurityGroupModalOpen, setIsSecurityGroupModalOpen] = useState(false);

  const { data: vn, isLoading, error } = useVirtualNetwork(id);
  const { data: subnets = [] } = useSubnets({
    filter: virtualNetworkFilterForSubnetList(id),
  });
  const { data: securityGroups = [] } = useSecurityGroups({
    filter: securityGroupFilterForVirtualNetwork(id),
  });

  const createSubnet = useCreateSubnet();
  const createSecurityGroup = useCreateSecurityGroup();

  const handleCreateSubnet = async (input: Parameters<typeof createSubnet.mutateAsync>[0]) => {
    const result = await createSubnet.mutateAsync(input);
    setIsSubnetModalOpen(false);
    return result;
  };

  const handleCreateSecurityGroup = async (
    input: Parameters<typeof createSecurityGroup.mutateAsync>[0],
  ) => {
    const result = await createSecurityGroup.mutateAsync(input);
    return result;
  };

  const handleNavigateToSecurityGroup = (sgId: string) => {
    setIsSecurityGroupModalOpen(false);
    navigate(`/networking/security-groups/${sgId}`);
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
                  <DescriptionListTerm>{t('IPv4 CIDR')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {vn?.spec?.ipv4Cidr ?? '—'}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                {vn?.spec?.ipv6Cidr && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('IPv6 CIDR')}</DescriptionListTerm>
                    <DescriptionListDescription>{vn.spec.ipv6Cidr}</DescriptionListDescription>
                  </DescriptionListGroup>
                )}

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

          <Card style={{ marginBottom: '1rem' }}>
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
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              actions={{
                actions: (
                  <Button variant="primary" onClick={() => setIsSecurityGroupModalOpen(true)}>
                    {t('Create security group')}
                  </Button>
                ),
              }}
            >
              <CardTitle>{t('Security Groups')}</CardTitle>
            </CardHeader>
            <CardBody>
              {securityGroups.length === 0 ? (
                <SubtleContent component="p">
                  {t('No security groups yet. Create one to get started.')}
                </SubtleContent>
              ) : (
                <Table aria-label="Security groups" variant="compact" borders>
                  <Thead>
                    <Tr>
                      <Th>{t('Name')}</Th>
                      <Th>{t('Inbound Rules')}</Th>
                      <Th>{t('Outbound Rules')}</Th>
                      <Th>{t('Status')}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {securityGroups.map((sg) => {
                      const name = sg.metadata?.name ?? sg.id;
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

      {isSecurityGroupModalOpen && (
        <SecurityGroupCreateModal
          isOpen={isSecurityGroupModalOpen}
          onClose={() => setIsSecurityGroupModalOpen(false)}
          onCreate={handleCreateSecurityGroup}
          onNavigate={handleNavigateToSecurityGroup}
          virtualNetworkId={id}
        />
      )}
    </>
  );
};
