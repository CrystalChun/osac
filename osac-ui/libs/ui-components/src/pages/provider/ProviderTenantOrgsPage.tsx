import { Alert, Label } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { useOrganizations } from '@osac/ui-components/api/v1/organization';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';

import {
  readOrganizationDescription,
  readOrganizationDisplayName,
  readOrganizationStatus,
  readOrganizationVmCount,
} from '../../utils/adminWireDisplay';

import '../../components/shared/DataTable.css';

export const ProviderTenantOrgsPage = () => {
  const { data: organizations = [], isLoading, error } = useOrganizations();

  return (
    <ListPage
      title="Tenant organizations"
      description="All tenant organizations registered on this platform."
    >
      <ListPageBody isLoading={isLoading} error={error}>
        {organizations.length === 0 ? (
          <Alert variant="info" isInline title="No organizations found">
            No tenant organizations are registered on this platform yet.
          </Alert>
        ) : (
          <Table aria-label="Tenant organizations">
            <Thead>
              <Tr>
                <Th>Organization</Th>
                <Th>ID</Th>
                <Th>Description</Th>
                <Th>VMs</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {organizations.map((org) => {
                const status = readOrganizationStatus(org);
                return (
                  <Tr key={org.id}>
                    <Td dataLabel="Organization" className="osac-data-table__primary-cell">
                      {readOrganizationDisplayName(org)}
                    </Td>
                    <Td dataLabel="ID" className="osac-data-table__muted-cell">
                      {org.metadata?.name ?? '—'}
                    </Td>
                    <Td dataLabel="Description" className="osac-data-table__description-cell">
                      {readOrganizationDescription(org) ?? '—'}
                    </Td>
                    <Td dataLabel="VMs">{readOrganizationVmCount(org) ?? '—'}</Td>
                    <Td dataLabel="Status">
                      <Label color={status === 'active' ? 'green' : 'grey'} isCompact>
                        {status ?? 'unknown'}
                      </Label>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </ListPageBody>
    </ListPage>
  );
};
