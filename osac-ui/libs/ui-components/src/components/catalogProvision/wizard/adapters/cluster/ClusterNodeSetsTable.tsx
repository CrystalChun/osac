import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ClusterTemplate } from '@osac/types';

import type { ClusterNodeSetValues } from './fields';
import ClusterPoolSizeField from '../../fields/ClusterPoolSizeField';
import { hostTypeDisplayName, useHostType } from '../../../../../api/v1/host-types';
import { useTranslation } from '../../../../../hooks/useTranslation';

interface ClusterNodeSetsTableProps {
  templateLoading: boolean;
  poolNames: string[];
  template: ClusterTemplate | undefined;
  nodeSets: Record<string, ClusterNodeSetValues>;
}

const ClusterPoolHostTypeLabel = ({ hostTypeId }: { hostTypeId: string }) => {
  const { data: hostType } = useHostType(hostTypeId);
  if (!hostType) {
    return hostTypeId;
  }
  return hostTypeDisplayName(hostType);
};

const ClusterNodeSetsTable = ({
  templateLoading,
  poolNames,
  template,
  nodeSets,
}: ClusterNodeSetsTableProps) => {
  const { t } = useTranslation();

  return (
    <Table aria-label={t('Node sets')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Pool')}</Th>
          <Th>{t('Host type')}</Th>
          <Th>{t('Size')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {templateLoading ? (
          <Tr>
            <Td colSpan={3}>{t('catalogProvision.common.loading')}</Td>
          </Tr>
        ) : null}
        {!templateLoading && poolNames.length === 0 ? (
          <Tr>
            <Td colSpan={3}>{t('No node sets defined in the template.')}</Td>
          </Tr>
        ) : null}
        {poolNames.map((poolName) => {
          const pool = nodeSets[poolName];
          const hostTypeId = pool?.hostType ?? template?.nodeSets?.[poolName]?.hostType ?? '';
          return (
            <Tr key={poolName}>
              <Td>{poolName}</Td>
              <Td>
                <ClusterPoolHostTypeLabel hostTypeId={hostTypeId} />
              </Td>
              <Td>
                <ClusterPoolSizeField poolName={poolName} isRequired={poolNames.length > 0} />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

export default ClusterNodeSetsTable;
