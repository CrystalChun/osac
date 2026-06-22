/**
 * flow: provider-administration
 * step: pad_tenant_organizations
 */
import { useEffect } from 'react';
import { Alert, Bullseye, Button, Label, PageSection, Spinner } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { useOrganizations } from '@osac/ui-components/api/v1/organization';
import { PageDataSection } from '@osac/ui-components/components/layout/PageDataSection';
import { PageHeader } from '@osac/ui-components/components/layout/PageHeader';
import '@osac/ui-components/components/shared/DataTable.css';

import {
  readOrganizationDescription,
  readOrganizationDisplayName,
  readOrganizationStatus,
  readOrganizationVmCount,
} from '../../utils/adminWireDisplay';

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
      </PageDataSection>
    </PageSection>
  );
};
