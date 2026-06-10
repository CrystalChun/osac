/**
 * flow: tenant-administration
 * step: tad_users
 */
import { useEffect } from 'react';
import { Alert, Bullseye, Button, Label, PageSection, Spinner } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useUsers } from '../../api/hooks';
import { PageHeader } from '../../components/layout/PageHeader';
import '../../components/shared/DataTable.css';

export const AdminUsersPage = () => {
  const { data: users = [], isPending, isError, error, refetch } = useUsers();

  useEffect(() => {
    if (isError && error) {
      // eslint-disable-next-line no-console -- diagnostics only; user sees generic Alert copy
      console.error('Failed to load users', error);
    }
  }, [isError, error]);

  return (
    <PageSection>
      <PageHeader title="Users" description="Manage users and access for your organization." />

      {isPending ? (
        <Bullseye className="osac-data-table__loading">
          <Spinner aria-label="Loading users" />
        </Bullseye>
      ) : isError ? (
        <Alert
          variant="danger"
          isInline
          title="Could not load users"
          actionLinks={
            <Button variant="link" isInline onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          Unable to load users right now. Please try again.
        </Alert>
      ) : users.length === 0 ? (
        <Alert variant="info" isInline title="No users found">
          No users are registered for this organization yet.
        </Alert>
      ) : (
        <Table aria-label="Tenant users">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Last login</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map((user) => (
              <Tr key={user.id}>
                <Td dataLabel="Name" className="osac-data-table__primary-cell">
                  {user.displayName}
                </Td>
                <Td dataLabel="Email">{user.email ?? '—'}</Td>
                <Td dataLabel="Role">
                  {user.role ? (
                    <Label color="blue" isCompact variant="outline">
                      {user.role}
                    </Label>
                  ) : (
                    '—'
                  )}
                </Td>
                <Td dataLabel="Status">
                  {user.status ? (
                    <Label color={user.status === 'active' ? 'green' : 'grey'} isCompact>
                      {user.status}
                    </Label>
                  ) : (
                    '—'
                  )}
                </Td>
                <Td dataLabel="Last login" className="osac-data-table__muted-cell">
                  {user.lastLogin ?? '—'}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </PageSection>
  );
};
