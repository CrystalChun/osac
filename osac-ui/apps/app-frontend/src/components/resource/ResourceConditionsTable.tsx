import { Content } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ClusterCondition } from '@osac/types';
import { Timestamp } from '@osac/ui-components/Timestamp';

import { formatConditionStatusForDisplay, humanizeConditionType } from './detailFormatters';

interface ResourceConditionsTableProps {
  conditions: ClusterCondition[];
  ariaLabel: string;
  emptyMessage?: string;
}

export const ResourceConditionsTable = ({
  conditions,
  ariaLabel,
  emptyMessage = 'No conditions reported.',
}: ResourceConditionsTableProps) => {
  if (conditions.length === 0) {
    return (
      <Content component="p" className="osac-resource-detail__empty-state">
        {emptyMessage}
      </Content>
    );
  }

  return (
    <Table aria-label={ariaLabel} variant="compact">
      <Thead>
        <Tr>
          <Th>Type</Th>
          <Th>Status</Th>
          <Th>Reason</Th>
          <Th>Message</Th>
          <Th>Last transition</Th>
        </Tr>
      </Thead>
      <Tbody>
        {conditions.map((c, i) => (
          <Tr key={`${c.type}-${i}`}>
            <Td dataLabel="Type">{humanizeConditionType(c.type)}</Td>
            <Td dataLabel="Status">{formatConditionStatusForDisplay(c.status)}</Td>
            <Td dataLabel="Reason">{c.reason ?? '—'}</Td>
            <Td dataLabel="Message">{c.message ?? '—'}</Td>
            <Td dataLabel="Last transition">
              <Timestamp value={c.lastTransitionTime} />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};
