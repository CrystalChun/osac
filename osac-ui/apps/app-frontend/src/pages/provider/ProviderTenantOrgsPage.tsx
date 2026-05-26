/**
 * flow: provider-administration
 * step: pad_tenant_organizations
 */
import { Label, PageSection } from '@patternfly/react-core'
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { DEMO_ORGANIZATIONS } from '@osac/api-contracts'
import { PageHeader } from '../../components/layout'

export function ProviderTenantOrgsPage() {
  return (
    <PageSection>
      <PageHeader
        title="Tenant organizations"
        description="All tenant organizations registered on this platform."
      />

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
          {DEMO_ORGANIZATIONS.map((org) => (
            <Tr key={org.id}>
              <Td dataLabel="Organization" style={{ fontWeight: 600 }}>
                {org.displayName}
              </Td>
              <Td
                dataLabel="ID"
                style={{
                  color: 'var(--pf-t--global--text--color--subtle)',
                }}
              >
                {org.metadata.name}
              </Td>
              <Td
                dataLabel="Description"
                style={{
                  color: 'var(--pf-t--global--text--color--subtle)',
                  maxWidth: '320px',
                }}
              >
                {org.description}
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
    </PageSection>
  )
}
