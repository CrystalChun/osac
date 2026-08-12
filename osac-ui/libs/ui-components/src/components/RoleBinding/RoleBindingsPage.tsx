import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import RoleBindingActionsMenu from './RoleBindingActionsMenu';
import RoleBindingStatusLabel from './RoleBindingStatusLabel';
import { useRoles } from '../../api/v1/role';
import { useRoleBindings } from '../../api/v1/role-binding';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { SubtleContent } from '../../components/SubtleContent/SubtleContent';
import { useTranslation } from '../../hooks/useTranslation';

const RoleBindingsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: roleBindings = [], isLoading, error } = useRoleBindings();
  const { data: roles = [] } = useRoles();

  const rolesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const role of roles) {
      map.set(role.id, role.spec?.title || role.metadata?.name || role.id);
    }
    return map;
  }, [roles]);

  return (
    <ListPage
      title={t('Role Bindings')}
      description={t('Manage role bindings for users.')}
      error={error}
      actions={
        <Button variant="primary" onClick={() => navigate('create')}>
          {t('Create role binding')}
        </Button>
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        {roleBindings.length === 0 ? (
          <SubtleContent component="p">{t('No role bindings available.')}</SubtleContent>
        ) : (
          <Table aria-label={t('Role Bindings')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Status')}</Th>
                <Th>{t('Role')}</Th>
                <Th>{t('Users')}</Th>
                <Th aria-label={t('Actions')} />
              </Tr>
            </Thead>
            <Tbody>
              {roleBindings.map((rb) => (
                <Tr key={rb.id}>
                  <Td dataLabel={t('Name')}>{rb.metadata?.name || rb.id}</Td>
                  <Td dataLabel={t('Status')}>
                    <RoleBindingStatusLabel rb={rb} />
                  </Td>
                  <Td dataLabel={t('Role')}>
                    {rb.spec?.role?.name ? rolesById.get(rb.spec.role.id) : '-'}
                  </Td>
                  <Td dataLabel={t('Users')}>
                    {rb.spec ? t('{{count}} user', { count: rb.spec.users.length }) : '-'}
                  </Td>
                  <Td isActionCell>
                    <RoleBindingActionsMenu roleBinding={rb} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </ListPageBody>
    </ListPage>
  );
};

export default RoleBindingsPage;
