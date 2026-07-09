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

import { SecurityGroupState } from '@osac/types';

import { resourceDisplayName, useSecurityGroup, useVirtualNetworks } from '../../api/v1/networking';
import { SecurityGroupDeleteModal } from '../../components/networking/SecurityGroupDeleteModal';
import { SecurityGroupDeleteRuleModal } from '../../components/networking/SecurityGroupDeleteRuleModal';
import { SecurityGroupRuleModal } from '../../components/networking/SecurityGroupRuleModal';
import { SecurityGroupRulesTable } from '../../components/networking/SecurityGroupRulesTable';
import { SecurityGroupStatusLabel } from '../../components/networking/SecurityGroupStatusLabel';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { useTranslation } from '../../hooks/useTranslation';

type RuleTarget = { direction: 'ingress' | 'egress'; ruleIndex?: number };

export const SecurityGroupDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams() as { id: string };
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const [ruleEditor, setRuleEditor] = useState<RuleTarget | null>(null);
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<Required<RuleTarget> | null>(null);
  const [showDeleteSgModal, setShowDeleteSgModal] = useState(false);

  const { data: sg, isLoading, error } = useSecurityGroup(id);
  const { data: virtualNetworks = [] } = useVirtualNetworks();

  const sgName = sg?.metadata?.name ?? id;
  const isFailed = sg?.status?.state === SecurityGroupState.FAILED;

  const vnId = sg?.spec?.virtualNetwork ?? '';
  const vn = virtualNetworks.find((v) => v.id === vnId);
  const vnName = resourceDisplayName(vn?.metadata, vnId);

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
                  onAddRule={() => setRuleEditor({ direction: 'ingress' })}
                  onEditRule={(ruleIndex) => setRuleEditor({ direction: 'ingress', ruleIndex })}
                  onDeleteRule={(ruleIndex) =>
                    setDeleteRuleTarget({ direction: 'ingress', ruleIndex })
                  }
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
                  onAddRule={() => setRuleEditor({ direction: 'egress' })}
                  onEditRule={(ruleIndex) => setRuleEditor({ direction: 'egress', ruleIndex })}
                  onDeleteRule={(ruleIndex) =>
                    setDeleteRuleTarget({ direction: 'egress', ruleIndex })
                  }
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

      {ruleEditor && sg && (
        <SecurityGroupRuleModal
          onClose={() => setRuleEditor(null)}
          securityGroup={sg}
          direction={ruleEditor.direction}
          ruleIndex={ruleEditor.ruleIndex}
        />
      )}

      {deleteRuleTarget && sg && (
        <SecurityGroupDeleteRuleModal
          onClose={() => setDeleteRuleTarget(null)}
          securityGroup={sg}
          direction={deleteRuleTarget.direction}
          ruleIndex={deleteRuleTarget.ruleIndex}
        />
      )}

      {showDeleteSgModal && (
        <SecurityGroupDeleteModal
          onClose={() => setShowDeleteSgModal(false)}
          onDeleted={() => navigate('/networking/security-groups')}
          securityGroupId={id}
        />
      )}
    </ListPage>
  );
};
