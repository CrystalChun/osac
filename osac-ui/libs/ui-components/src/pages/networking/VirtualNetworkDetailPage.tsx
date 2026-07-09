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
  type SubnetInput,
  securityGroupFilterForVirtualNetwork,
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
import { getErrorMessage } from '../../utils/error';

export const VirtualNetworkDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const [isSubnetModalOpen, setIsSubnetModalOpen] = useState(false);
  const [isSecurityGroupModalOpen, setIsSecurityGroupModalOpen] = useState(false);

  const { data: vn, isLoading, error } = useVirtualNetwork(id);
  const {
    data: subnets = [],
    isLoading: isLoadingSubnets,
    error: subnetsError,
  } = useSubnets({
    filter: virtualNetworkFilterForSubnetList(id),
  });
  const {
    data: securityGroups = [],
    isLoading: isLoadingSecurityGroups,
    error: securityGroupsError,
  } = useSecurityGroups({
    filter: securityGroupFilterForVirtualNetwork(id),
  });

  const createSubnet = useCreateSubnet();

  const handleCreateSubnet = async (input: SubnetInput) => {
    await createSubnet.mutateAsync(input);
    setIsSubnetModalOpen(false);
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

                {vn?.status?.message && !isFailed && (
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
              {isLoadingSubnets ? (
                <SubtleContent component="p">{t('Loading subnets...')}</SubtleContent>
              ) : subnetsError ? (
                <Alert variant="danger" title={t('Failed to load subnets')} isInline>
                  {getErrorMessage(subnetsError)}
                </Alert>
              ) : subnets.length === 0 ? (
                <SubtleContent component="p">
                  {t('No subnets yet. Create one to get started.')}
                </SubtleContent>
              ) : (
                <Table aria-label={t('Subnets')} variant="compact" borders>
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
              <CardTitle>{t('Security groups')}</CardTitle>
            </CardHeader>
            <CardBody>
              {isLoadingSecurityGroups ? (
                <SubtleContent component="p">{t('Loading security groups...')}</SubtleContent>
              ) : securityGroupsError ? (
                <Alert variant="danger" title={t('Failed to load security groups')} isInline>
                  {getErrorMessage(securityGroupsError)}
                </Alert>
              ) : securityGroups.length === 0 ? (
                <SubtleContent component="p">
                  {t('No security groups yet. Create one to get started.')}
                </SubtleContent>
              ) : (
                <Table aria-label={t('Security groups')} variant="compact" borders>
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
                      const sgName = sg.metadata?.name ?? sg.id;
                      const ingressCount = sg.spec?.ingress?.length ?? 0;
                      const egressCount = sg.spec?.egress?.length ?? 0;

                      return (
                        <Tr key={sg.id}>
                          <Td dataLabel={t('Name')}>
                            <Button
                              variant="link"
                              isInline
                              onClick={() => navigate(`/networking/security-groups/${sg.id}`)}
                            >
                              {sgName}
                            </Button>
                          </Td>
                          <Td dataLabel={t('Inbound Rules')}>{ingressCount}</Td>
                          <Td dataLabel={t('Outbound Rules')}>{egressCount}</Td>
                          <Td dataLabel={t('Status')}>
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

      {isSecurityGroupModalOpen && (
        <SecurityGroupCreateModal
          onClose={() => setIsSecurityGroupModalOpen(false)}
          virtualNetworkId={id}
        />
      )}

      {isSubnetModalOpen && vn && (
        <SubnetCreateModal
          onClose={() => setIsSubnetModalOpen(false)}
          onCreate={handleCreateSubnet}
          parentVN={vn}
          existingSubnets={subnets}
        />
      )}
    </>
  );
};
