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
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  List,
  ListItem,
  Stack,
  Title,
} from '@patternfly/react-core';

import { type NATGateway, VirtualNetworkState } from '@osac/types';
import CreateButton from '@osac/ui-components/components/Primitives/CreateButton.tsx';
import ResourceNameField from '@osac/ui-components/components/Resource/ResourceNameField.tsx';

import {
  useNatGateway,
  useSecurityGroups,
  useSubnets,
  useVirtualNetwork,
  virtualNetworkScopeFilter,
} from '../../api/v1/networking';
import { DetachNatGatewayModal } from '../../components/networking/DetachNatGatewayModal';
import NatGatewayCard from '../../components/networking/NatGatewayCard';
import { SecurityGroupCreateModal } from '../../components/networking/SecurityGroupCreateModal';
import { SecurityGroupStatusLabel } from '../../components/networking/SecurityGroupStatusLabel';
import { SubnetCreateModal } from '../../components/networking/SubnetCreateModal';
import { SubnetStatusLabel } from '../../components/networking/SubnetStatusLabel';
import { VirtualNetworkStatusLabel } from '../../components/networking/VirtualNetworkStatusLabel';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { Timestamp } from '../../components/Primitives/Timestamp';
import { SubtleContent } from '../../components/SubtleContent/SubtleContent';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

export const VirtualNetworkDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const [isSubnetModalOpen, setIsSubnetModalOpen] = useState(false);
  const [isSecurityGroupModalOpen, setIsSecurityGroupModalOpen] = useState(false);
  const [detachTarget, setDetachTarget] = useState<NATGateway>();

  const { data: vn, isLoading, error } = useVirtualNetwork(id);
  const {
    data: subnets = [],
    isLoading: isLoadingSubnets,
    error: subnetsError,
  } = useSubnets({
    filter: virtualNetworkScopeFilter(id),
  });
  const {
    data: securityGroups = [],
    isLoading: isLoadingSecurityGroups,
    error: securityGroupsError,
  } = useSecurityGroups({
    filter: virtualNetworkScopeFilter(id),
  });
  const { natGateway, natAddress } = useNatGateway(id);

  const vnName = vn?.metadata?.name ?? id;
  const isFailed = vn?.status?.state === VirtualNetworkState.FAILED;

  return (
    <>
      <ListPage
        title={vnName}
        description={t('View the virtual network configuration and related resources.')}
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
            <Alert variant="danger" title={t('Provisioning failed')} isInline>
              {vn.status.message}
            </Alert>
          )}

          <Grid hasGutter>
            <GridItem md={8}>
              <Card>
                <CardTitle>{t('Details')}</CardTitle>
                <CardBody>
                  <Grid hasGutter>
                    <GridItem md={6}>
                      <Title headingLevel="h2" size="lg">
                        {t('Overview')}
                      </Title>
                      <DescriptionList isCompact aria-label={t('Overview')}>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            <VirtualNetworkStatusLabel state={vn?.status?.state} />
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Timestamp value={vn?.metadata?.creationTimestamp} />
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        {vn?.status?.message && !isFailed && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Message')}</DescriptionListTerm>
                            <DescriptionListDescription>
                              {vn.status.message}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                      </DescriptionList>
                    </GridItem>
                    <GridItem md={6}>
                      <Title headingLevel="h2" size="lg">
                        {t('Configuration')}
                      </Title>
                      <DescriptionList isCompact aria-label={t('Configuration')}>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('IPv4 CIDR')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            <code>{vn?.spec?.ipv4Cidr ?? '—'}</code>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('IPv6 CIDR')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            <code>{vn?.spec?.ipv6Cidr ?? '—'}</code>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </GridItem>
                  </Grid>
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  actions={{
                    actions: (
                      <CreateButton variant="secondary" onClick={() => setIsSubnetModalOpen(true)}>
                        {t('Create subnet')}
                      </CreateButton>
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
                    <List isPlain aria-label={t('Subnets')}>
                      {subnets.map((subnet) => (
                        <ListItem key={subnet.id}>
                          <Flex
                            alignItems={{ default: 'alignItemsCenter' }}
                            justifyContent={{ default: 'justifyContentSpaceBetween' }}
                            gap={{ default: 'gapMd' }}
                          >
                            <FlexItem>
                              <Stack hasGutter>
                                <FlexItem>
                                  <ResourceNameField resource={subnet} />
                                </FlexItem>
                                <FlexItem>
                                  <Content component="small">
                                    <code>{subnet.spec?.ipv4Cidr ?? '—'}</code>
                                  </Content>
                                </FlexItem>
                              </Stack>
                            </FlexItem>
                            <FlexItem>
                              <SubnetStatusLabel state={subnet.status?.state} />
                            </FlexItem>
                          </Flex>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  actions={{
                    actions: (
                      <CreateButton
                        variant="secondary"
                        onClick={() => setIsSecurityGroupModalOpen(true)}
                      >
                        {t('Create security group')}
                      </CreateButton>
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
                    <List isPlain aria-label={t('Security groups')}>
                      {securityGroups.map((sg) => {
                        const ingressCount = sg.spec?.ingress?.length ?? 0;
                        const egressCount = sg.spec?.egress?.length ?? 0;

                        return (
                          <ListItem key={sg.id}>
                            <Flex
                              alignItems={{ default: 'alignItemsCenter' }}
                              justifyContent={{ default: 'justifyContentSpaceBetween' }}
                              gap={{ default: 'gapMd' }}
                            >
                              <FlexItem>
                                <Stack hasGutter>
                                  <FlexItem>
                                    <ResourceNameField
                                      resource={sg}
                                      detailsUrl={`/networking/security-groups/${sg.id}`}
                                    />
                                  </FlexItem>
                                  <FlexItem>
                                    <Content component="small">
                                      {t('In: {{ingress}} · Out: {{egress}}', {
                                        ingress: ingressCount,
                                        egress: egressCount,
                                      })}
                                    </Content>
                                  </FlexItem>
                                </Stack>
                              </FlexItem>
                              <FlexItem>
                                <SecurityGroupStatusLabel state={sg.status?.state} />
                              </FlexItem>
                            </Flex>
                          </ListItem>
                        );
                      })}
                    </List>
                  )}
                </CardBody>
              </Card>
            </GridItem>

            <GridItem md={4}>
              <NatGatewayCard
                natAddress={natAddress}
                natGateway={natGateway}
                onAttach={() => navigate(`/networking/virtual-networks/${id}/nat-gateway/attach`)}
                onDetach={setDetachTarget}
              />
            </GridItem>
          </Grid>
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
          parentVN={vn}
          existingSubnets={subnets}
        />
      )}
      {detachTarget && (
        <DetachNatGatewayModal
          natGateway={detachTarget}
          onClose={() => setDetachTarget(undefined)}
        />
      )}
    </>
  );
};
