import { useEffect } from 'react';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useFormikContext } from 'formik';

import type { ClusterTemplate } from '@osac/types';

import type { ClusterNodeSetValues, ClusterWizardValues } from './fields';
import { hostTypeDisplayName, useHostType } from '../../../../../api/v1/host-types';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { formatLabeledResourceRefForReview } from '../../../../Form/labeledResourceRef';
import ClusterPoolSizeField from '../../fields/ClusterPoolSizeField';

interface ClusterNodeSetsTableProps {
  templateLoading: boolean;
  poolNames: string[];
  template: ClusterTemplate | undefined;
  nodeSets: Record<string, ClusterNodeSetValues>;
}

const ClusterPoolHostTypeCell = ({
  poolName,
  hostTypeRef,
}: {
  poolName: string;
  hostTypeRef: ClusterNodeSetValues['hostType'];
}) => {
  const hostTypeId = hostTypeRef.value.trim();
  const { data: hostType } = useHostType(hostTypeId || undefined);
  const { setFieldValue } = useFormikContext<ClusterWizardValues>();

  useEffect(() => {
    if (!hostType || !hostTypeId) {
      return;
    }
    const label = hostTypeDisplayName(hostType);
    if (hostTypeRef.label === label) {
      return;
    }
    void setFieldValue(`spec.nodeSets.${poolName}.hostType`, { value: hostTypeId, label }, false);
  }, [hostType, hostTypeId, hostTypeRef.label, poolName, setFieldValue]);

  return formatLabeledResourceRefForReview(hostTypeRef);
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
          const hostTypeRef = pool?.hostType ?? {
            value: template?.nodeSets?.[poolName]?.hostType ?? '',
            label: '',
          };
          return (
            <Tr key={poolName}>
              <Td>{poolName}</Td>
              <Td>
                <ClusterPoolHostTypeCell poolName={poolName} hostTypeRef={hostTypeRef} />
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
