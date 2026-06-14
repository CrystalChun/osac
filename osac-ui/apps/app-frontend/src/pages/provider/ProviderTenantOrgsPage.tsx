/**
 * flow: provider-administration
 * step: pad_tenant_organizations
 */
import { useEffect } from 'react';
import { Alert, Bullseye, Button, Label, PageSection, Spinner } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useOrganizations } from '../../api/hooks';
import { PageHeader } from '../../components/layout/PageHeader';
import { PageDataSection } from '../../components/layout/PageDataSection';
import '../../components/shared/DataTable.css';

export const ProviderTenantOrgsPage = () => {
  const { data: organizations = [], isPending, isError, error, refetch } = useOrganizations();

  useEffect(() => {
    if (isError && error) {
      // eslint-disable-next-line no-console -- diagnostics only; user sees generic Alert copy
      console.error('Failed to load organizations', error);
    }
  }, [isError, error]);

  return (
    <PageSection isFilled className="osac-page">
      <PageHeader
        title="Tenant organizations"
        description="All tenant organizations registered on this platform."
      />

      <PageDataSection scrollable>
        {isPending ? (
          <Bullseye className="osac-data-table__loading">
            <Spinner aria-label="Loading organizations" />
          </Bullseye>
        ) : isError ? (
          <Alert
            variant="danger"
            isInline
            title="Could not load organizations"
            actionLinks={
              <Button variant="link" isInline onClick={() => void refetch()}>
                Retry
              </Button>
            }
          >
            Unable to load organizations right now. Please try again.
          </Alert>
        ) : organizations.length === 0 ? (
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
              {organizations.map((org) => (
                <Tr key={org.id}>
                  <Td dataLabel="Organization" className="osac-data-table__primary-cell">
                    {org.displayName}
                  </Td>
                  <Td dataLabel="ID" className="osac-data-table__muted-cell">
                    {org.metadata.name}
                  </Td>
                  <Td dataLabel="Description" className="osac-data-table__description-cell">
                    {org.description ?? '—'}
                  </Td>
                  <Td dataLabel="VMs">{org.vmCount ?? '—'}</Td>
                  <Td dataLabel="Status">
                    <Label color={org.status === 'active' ? 'green' : 'grey'} isCompact>
                      {org.status ?? 'unknown'}
                    </Label>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </PageDataSection>
    </PageSection>
  );
};
