import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Popover, Stack, StackItem } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { RoleBinding } from '@osac/types';

import RoleBindingActionsMenu from './RoleBindingActionsMenu';
import RoleBindingStatusLabel from './RoleBindingStatusLabel';
import { useRoles } from '../../api/v1/role';
import { useRoleBindings } from '../../api/v1/role-binding';
import { useUsers } from '../../api/v1/user';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { SubtleContent } from '../../components/SubtleContent/SubtleContent';
import { useTranslation } from '../../hooks/useTranslation';

const MultipleUsersPopover = ({ roleBinding }: { roleBinding: RoleBinding }) => {
  const usersFilter = useMemo(
    () =>
      roleBinding.spec?.users.length
        ? `this.id in [${[...roleBinding.spec.users].map(({ id }) => `"${id}"`).join(', ')}]`
        : '',
    [roleBinding.spec?.users],
  );
  const { data: users = [] } = useUsers(
    usersFilter ? { filter: usersFilter } : {},
    !roleBinding.spec?.users.length,
  );

  return (
    <Stack>
      {users.map((u) => (
        <StackItem key={u.id}>{u.spec?.username || u.metadata?.name || u.id}</StackItem>
      ))}
    </Stack>
  );
};

const UsersColumn = ({
  roleBinding,
  usersById,
}: {
  roleBinding: RoleBinding;
  usersById: Map<string, string>;
}) => {
  const { t } = useTranslation();
  if (!roleBinding.spec?.users.length) {
    return '-';
  }

  if (roleBinding.spec.users.length === 1) {
    return <div>{usersById.get(roleBinding.spec.users[0].id)}</div>;
  }

  return (
    <Popover
      aria-label={t('Multiple users popover')}
      headerContent={t('Users')}
      bodyContent={<MultipleUsersPopover roleBinding={roleBinding} />}
    >
      <Button variant="link" isInline>
        {t('Multiple users')}
      </Button>
    </Popover>
  );
};

const RoleBindingsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: roleBindings = [], isLoading, error } = useRoleBindings();

  const userIds = useMemo(() => {
    const ids = new Set<string>();
    for (const rb of roleBindings) {
      if (rb.spec?.users.length === 1) {
        ids.add(rb.spec.users[0].id);
      }
    }
    return ids;
  }, [roleBindings]);

  const usersFilter = useMemo(
    () => (userIds.size ? `this.id in [${[...userIds].map((id) => `"${id}"`).join(', ')}]` : ''),
    [userIds],
  );

  const { data: roles = [] } = useRoles();
  const { data: users = [] } = useUsers(usersFilter ? { filter: usersFilter } : {}, !userIds.size);

  const rolesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const role of roles) {
      map.set(role.id, role.spec?.title || role.metadata?.name || role.id);
    }
    return map;
  }, [roles]);

  const usersById = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of users) {
      map.set(user.id, user.spec?.username || user.metadata?.name || user.id);
    }
    return map;
  }, [users]);

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
                    <UsersColumn roleBinding={rb} usersById={usersById} />
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
