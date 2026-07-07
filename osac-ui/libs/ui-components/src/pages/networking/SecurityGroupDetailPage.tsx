import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Tab,
  TabTitleText,
  Tabs,
} from '@patternfly/react-core';

import { SecurityGroupState, type SecurityRule } from '@osac/types';

import {
  resourceDisplayName,
  useSecurityGroup,
  useUpdateSecurityGroup,
  useVirtualNetworks,
} from '../../api/v1/networking';
import { SecurityGroupRuleModal } from '../../components/networking/SecurityGroupRuleModal';
import { SecurityGroupRulesTable } from '../../components/networking/SecurityGroupRulesTable';
import { SecurityGroupStatusLabel } from '../../components/networking/SecurityGroupStatusLabel';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { useTranslation } from '../../hooks/useTranslation';

export const SecurityGroupDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [ruleModalState, setRuleModalState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    direction: 'ingress' | 'egress';
    ruleIndex?: number;
    initialValues?: SecurityRule;
  }>({
    isOpen: false,
    mode: 'add',
    direction: 'ingress',
  });

  const { data: sg, isLoading, error } = useSecurityGroup(id);
  const { data: virtualNetworks = [] } = useVirtualNetworks();
  const updateSecurityGroup = useUpdateSecurityGroup();

  const sgName = sg?.metadata?.name ?? id;
  const isFailed = sg?.status?.state === SecurityGroupState.FAILED;

  const vnId = sg?.spec?.virtualNetwork ?? '';
  const vn = virtualNetworks.find((v) => v.id === vnId);
  const vnName = resourceDisplayName(vn?.metadata, vnId);

  // Helper to convert SecurityRule to plain object (strips protobuf metadata)
  const toPlainRule = (r: SecurityRule) => ({
    protocol: r.protocol,
    ...(r.portFrom !== undefined && { portFrom: r.portFrom }),
    ...(r.portTo !== undefined && { portTo: r.portTo }),
    ...(r.ipv4Cidr && { ipv4Cidr: r.ipv4Cidr }),
    ...(r.ipv6Cidr && { ipv6Cidr: r.ipv6Cidr }),
  });

  const handleAddIngressRule = () => {
    setRuleModalState({
      isOpen: true,
      mode: 'add',
      direction: 'ingress',
    });
  };

  const handleEditIngressRule = (index: number) => {
    const rule = sg?.spec?.ingress?.[index];
    if (!rule) {
      return;
    }
    setRuleModalState({
      isOpen: true,
      mode: 'edit',
      direction: 'ingress',
      ruleIndex: index,
      initialValues: rule,
    });
  };

  const handleDeleteIngressRule = async (index: number) => {
    if (!sg) {
      return;
    }
    try {
      setDeleteError(null);
      const newIngress = (sg.spec?.ingress ?? []).map(toPlainRule);
      newIngress.splice(index, 1);
      const newEgress = (sg.spec?.egress ?? []).map(toPlainRule);
      await updateSecurityGroup.mutateAsync({
        id: sg.id,
        input: {
          name: sg.metadata?.name ?? '',
          virtual_network: sg.spec?.virtualNetwork ?? '',
          ingress: newIngress,
          egress: newEgress,
        },
      });
    } catch {
      setDeleteError(t('Failed to delete rule. Please try again.'));
    }
  };

  const handleAddEgressRule = () => {
    setRuleModalState({
      isOpen: true,
      mode: 'add',
      direction: 'egress',
    });
  };

  const handleEditEgressRule = (index: number) => {
    const rule = sg?.spec?.egress?.[index];
    if (!rule) {
      return;
    }
    setRuleModalState({
      isOpen: true,
      mode: 'edit',
      direction: 'egress',
      ruleIndex: index,
      initialValues: rule,
    });
  };

  const handleDeleteEgressRule = async (index: number) => {
    if (!sg) {
      return;
    }
    try {
      setDeleteError(null);
      const newIngress = (sg.spec?.ingress ?? []).map(toPlainRule);
      const newEgress = (sg.spec?.egress ?? []).map(toPlainRule);
      newEgress.splice(index, 1);
      await updateSecurityGroup.mutateAsync({
        id: sg.id,
        input: {
          name: sg.metadata?.name ?? '',
          virtual_network: sg.spec?.virtualNetwork ?? '',
          ingress: newIngress,
          egress: newEgress,
        },
      });
    } catch {
      setDeleteError(t('Failed to delete rule. Please try again.'));
    }
  };

  const handleSaveRule = async (rule: SecurityRule) => {
    if (!sg) {
      return;
    }

    const { direction, mode, ruleIndex } = ruleModalState;
    const newIngress = (sg.spec?.ingress ?? []).map(toPlainRule);
    const newEgress = (sg.spec?.egress ?? []).map(toPlainRule);

    if (direction === 'ingress') {
      if (mode === 'add') {
        newIngress.push(rule);
      } else if (mode === 'edit' && ruleIndex !== undefined) {
        newIngress[ruleIndex] = rule;
      }
    } else {
      if (mode === 'add') {
        newEgress.push(rule);
      } else if (mode === 'edit' && ruleIndex !== undefined) {
        newEgress[ruleIndex] = rule;
      }
    }

    await updateSecurityGroup.mutateAsync({
      id: sg.id,
      input: {
        name: sg.metadata?.name ?? '',
        virtual_network: sg.spec?.virtualNetwork ?? '',
        ingress: newIngress,
        egress: newEgress,
      },
    });
  };

  const handleCloseRuleModal = () => {
    setRuleModalState({
      isOpen: false,
      mode: 'add',
      direction: 'ingress',
    });
  };

  return (
    <ListPage
      title={sgName}
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbItem>
            <Button variant="link" isInline onClick={() => navigate('/networking/security-groups')}>
              {t('Security groups')}
            </Button>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{sgName}</BreadcrumbItem>
        </Breadcrumb>
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        {deleteError && (
          <Alert variant="danger" title={t('Error')} isInline style={{ marginBottom: '1rem' }}>
            {deleteError}
          </Alert>
        )}

        {isFailed && sg?.status?.message && (
          <Alert
            variant="danger"
            title={t('Provisioning failed')}
            isInline
            style={{ marginBottom: '1rem' }}
          >
            {sg.status.message}
          </Alert>
        )}

        <Tabs
          activeKey={activeTabKey}
          onSelect={(_event, tabIndex) => setActiveTabKey(tabIndex)}
          aria-label="Security group tabs"
        >
          <Tab eventKey={0} title={<TabTitleText>{t('Inbound Rules')}</TabTitleText>}>
            <Card>
              <CardBody>
                <SecurityGroupRulesTable
                  rules={sg?.spec?.ingress ?? []}
                  direction="ingress"
                  onAddRule={handleAddIngressRule}
                  onEditRule={handleEditIngressRule}
                  onDeleteRule={handleDeleteIngressRule}
                />
              </CardBody>
            </Card>
          </Tab>

          <Tab eventKey={1} title={<TabTitleText>{t('Outbound Rules')}</TabTitleText>}>
            <Card>
              <CardBody>
                <SecurityGroupRulesTable
                  rules={sg?.spec?.egress ?? []}
                  direction="egress"
                  onAddRule={handleAddEgressRule}
                  onEditRule={handleEditEgressRule}
                  onDeleteRule={handleDeleteEgressRule}
                />
              </CardBody>
            </Card>
          </Tab>

          <Tab eventKey={2} title={<TabTitleText>{t('Details')}</TabTitleText>}>
            <Card>
              <CardTitle>{t('Details')}</CardTitle>
              <CardBody>
                <DescriptionList isHorizontal>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {sg?.metadata?.name ?? '—'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>

                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Virtual Network')}</DescriptionListTerm>
                    <DescriptionListDescription>
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
                    </DescriptionListDescription>
                  </DescriptionListGroup>

                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <SecurityGroupStatusLabel state={sg?.status?.state} />
                    </DescriptionListDescription>
                  </DescriptionListGroup>

                  {sg?.status?.message && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Message')}</DescriptionListTerm>
                      <DescriptionListDescription>{sg.status.message}</DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                </DescriptionList>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </ListPageBody>

      <SecurityGroupRuleModal
        isOpen={ruleModalState.isOpen}
        onClose={handleCloseRuleModal}
        onSave={handleSaveRule}
        direction={ruleModalState.direction}
        mode={ruleModalState.mode}
        initialValues={ruleModalState.initialValues}
      />
    </ListPage>
  );
};
