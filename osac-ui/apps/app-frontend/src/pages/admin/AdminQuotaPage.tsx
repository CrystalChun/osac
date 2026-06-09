/**
 * flow: tenant-administration
 * step: tad_quota
 */
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Flex,
  Gallery,
  GalleryItem,
  PageSection,
  Progress,
  ProgressSize,
  ProgressVariant,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { DEMO_QUOTA } from '@osac/api-contracts';
import type { QuotaEntry } from '@osac/api-contracts';
import { useSession } from '../../contexts/SessionContext';
import { PageHeader } from '../../components/layout';

const QuotaBar = ({ entry }: { entry: QuotaEntry }) => {
  const pct = entry.limit > 0 ? Math.min(100, (entry.used / entry.limit) * 100) : 0;
  const variant =
    pct >= 90
      ? ProgressVariant.danger
      : pct >= 70
        ? ProgressVariant.warning
        : ProgressVariant.success;

  return (
    <Flex
      direction={{ default: 'column' }}
      style={{ marginBottom: 'var(--pf-t--global--spacer--lg)' }}
    >
      <Flex
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}
      >
        <Content component="p" style={{ margin: 0, fontWeight: 600 }}>
          {entry.resource}
        </Content>
        <Content
          component="p"
          style={{ margin: 0, color: 'var(--pf-t--global--text--color--subtle)' }}
        >
          {entry.used} / {entry.limit} {entry.unit}
        </Content>
      </Flex>
      <Progress
        value={pct}
        title={entry.resource}
        measureLocation="none"
        variant={variant}
        size={ProgressSize.sm}
      />
      <Content
        component="small"
        style={{
          color: 'var(--pf-t--global--text--color--subtle)',
          display: 'block',
          marginTop: 'var(--pf-t--global--spacer--xs)',
        }}
      >
        {pct.toFixed(0)}% used
      </Content>
    </Flex>
  );
};

export const AdminQuotaPage = () => {
  const { selectedTenant } = useSession();
  const tenant =
    selectedTenant === 'northstar' || selectedTenant === 'evergreen' ? selectedTenant : 'northstar';
  const quota = DEMO_QUOTA[tenant];

  return (
    <PageSection>
      <PageHeader
        title="Quota control"
        description="View your organization's resource consumption and limits."
      />

      <Gallery hasGutter minWidths={{ default: '320px' }}>
        <GalleryItem>
          <Card>
            <CardHeader>
              <CardTitle>Resource utilization</CardTitle>
            </CardHeader>
            <CardBody>
              {quota.map((entry) => (
                <QuotaBar key={entry.resource} entry={entry} />
              ))}
            </CardBody>
          </Card>
        </GalleryItem>

        <GalleryItem>
          <Card>
            <CardHeader>
              <CardTitle>Quota summary</CardTitle>
            </CardHeader>
            <CardBody>
              <Table aria-label="Quota summary">
                <Thead>
                  <Tr>
                    <Th>Resource</Th>
                    <Th>Used</Th>
                    <Th>Limit</Th>
                    <Th>Unit</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {quota.map((entry) => (
                    <Tr key={entry.resource}>
                      <Td dataLabel="Resource" style={{ fontWeight: 600 }}>
                        {entry.resource}
                      </Td>
                      <Td dataLabel="Used">{entry.used}</Td>
                      <Td dataLabel="Limit">{entry.limit}</Td>
                      <Td
                        dataLabel="Unit"
                        style={{
                          color: 'var(--pf-t--global--text--color--subtle)',
                        }}
                      >
                        {entry.unit}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </GalleryItem>
      </Gallery>
    </PageSection>
  );
};
