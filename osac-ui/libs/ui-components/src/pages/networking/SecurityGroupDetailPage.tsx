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
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Stack,
  StackItem,
  Tab,
  TabTitleText,
  Tabs,
} from '@patternfly/react-core';

import { SecurityGroupState, type SecurityRule } from '@osac/types';

import {
  resourceDisplayName,
  useDeleteSecurityGroup,
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
import { getErrorMessage } from '../../utils/error';

export const SecurityGroupDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteRuleIndex, setDeleteRuleIndex] = useState<{
    index: number;
    direction: 'ingress' | 'egress';
  } | null>(null);
  const [showDeleteSgModal, setShowDeleteSgModal] = useState(false);
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
  const deleteSecurityGroup = useDeleteSecurityGroup();

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

  const handleDeleteIngressRule = (index: number) => {
    setDeleteRuleIndex({ index, direction: 'ingress' });
  };

  const confirmDeleteRule = async () => {
    if (!sg || !deleteRuleIndex) {
      return;
    }

    // Close modal immediately
    const ruleIndexToDelete = deleteRuleIndex;
    setDeleteRuleIndex(null);

    try {
      setDeleteError(null);
      const newIngress = (sg.spec?.ingress ?? []).map(toPlainRule);
      const newEgress = (sg.spec?.egress ?? []).map(toPlainRule);

      if (ruleIndexToDelete.direction === 'ingress') {
        newIngress.splice(ruleIndexToDelete.index, 1);
      } else {
        newEgress.splice(ruleIndexToDelete.index, 1);
      }

      // Mutation runs in background, onSuccess will invalidate cache and trigger refetch
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

  const handleDeleteEgressRule = (index: number) => {
    setDeleteRuleIndex({ index, direction: 'egress' });
  };

  const handleSaveRule = async (rule: SecurityRule) => {
    if (!sg) {
      return;
    }

    // Close modal immediately
    handleCloseRuleModal();

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

    // Mutation runs in background, onSuccess will invalidate cache and trigger refetch
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

  const handleDeleteSecurityGroup = async () => {
    try {
      await deleteSecurityGroup.mutateAsync(id);
      navigate('/networking/security-groups');
    } catch {
      // Error is shown in the modal
    }
  };

  return (
    <ListPage
      title={sgName}
      actions={
        <Button variant="danger" onClick={() => setShowDeleteSgModal(true)}>
          {t('Delete')}
        </Button>
      }
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

      {/* Delete Rule Confirmation Modal */}
      <Modal
        variant={ModalVariant.small}
        isOpen={deleteRuleIndex !== null}
        onClose={() => setDeleteRuleIndex(null)}
        aria-label={t('Delete rule')}
      >
        <ModalHeader title={t('Delete rule?')} titleIconVariant="warning" />
        <ModalBody>
          <Stack hasGutter>
            <StackItem>
              {t(
                'This will permanently delete the rule. This action cannot be undone. Traffic matching this rule will be blocked.',
              )}
            </StackItem>
            {deleteError && (
              <StackItem>
                <Alert variant="danger" title={t('Error')} isInline>
                  {deleteError}
                </Alert>
              </StackItem>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="danger"
            onClick={confirmDeleteRule}
            isDisabled={updateSecurityGroup.isPending}
            isLoading={updateSecurityGroup.isPending}
          >
            {t('Delete')}
          </Button>
          <Button
            variant="link"
            onClick={() => setDeleteRuleIndex(null)}
            isDisabled={updateSecurityGroup.isPending}
          >
            {t('Cancel')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Security Group Confirmation Modal */}
      <Modal
        variant={ModalVariant.small}
        isOpen={showDeleteSgModal}
        onClose={() => setShowDeleteSgModal(false)}
        aria-label={t('Delete security group')}
      >
        <ModalHeader title={t('Delete security group?')} titleIconVariant="warning" />
        <ModalBody>
          <Stack hasGutter>
            <StackItem>
              {t(
                'This will permanently delete the security group and all its rules. This action cannot be undone.',
              )}
            </StackItem>
            {deleteSecurityGroup.error && (
              <StackItem>
                <Alert variant="danger" title={t('Error')} isInline>
                  {getErrorMessage(deleteSecurityGroup.error)}
                </Alert>
              </StackItem>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="danger"
            onClick={handleDeleteSecurityGroup}
            isDisabled={deleteSecurityGroup.isPending}
            isLoading={deleteSecurityGroup.isPending}
          >
            {t('Delete')}
          </Button>
          <Button
            variant="link"
            onClick={() => setShowDeleteSgModal(false)}
            isDisabled={deleteSecurityGroup.isPending}
          >
            {t('Cancel')}
          </Button>
        </ModalFooter>
      </Modal>

    </ListPage>
  );
};
