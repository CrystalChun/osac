import { useMemo } from 'react';
import { Alert, Button, Stack, StackItem } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useFormikContext } from 'formik';

import type { ClusterWizardValues } from './fields';
import { createEmptyNodeSetRow } from './fields';
import { formatHostTypeOptionLabel, useHostTypes } from '../../../../../api/v1/host-types';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { SelectField } from '../../../../Form/SelectField';
import ClusterPoolSizeField from '../../fields/ClusterPoolSizeField';

const ClusterNodeSetsTable = () => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ClusterWizardValues>();
  const {
    data: hostTypes = [],
    isPending: hostTypesLoading,
    isError: hostTypesError,
    refetch: refetchHostTypes,
  } = useHostTypes();

  const selectedHostTypeIds = useMemo(
    () =>
      new Set(
        values.spec.nodeSetRows
          .map((row) => row.hostType.value.trim())
          .filter((hostTypeId) => hostTypeId.length > 0),
      ),
    [values.spec.nodeSetRows],
  );

  const hostTypeOptionsForRow = (rowIndex: number) => {
    const currentHostTypeId = values.spec.nodeSetRows[rowIndex]?.hostType.value.trim() ?? '';
    return hostTypes.map((hostType) => ({
      value: hostType.id,
      label: formatHostTypeOptionLabel(hostType),
      isDisabled: selectedHostTypeIds.has(hostType.id) && hostType.id !== currentHostTypeId,
    }));
  };

  const addRow = () => {
    void setFieldValue('spec.nodeSetRows', [...values.spec.nodeSetRows, createEmptyNodeSetRow()]);
  };

  const removeRow = (rowIndex: number) => {
    void setFieldValue(
      'spec.nodeSetRows',
      values.spec.nodeSetRows.filter((_, index) => index !== rowIndex),
    );
  };

  return (
    <Stack hasGutter>
      {hostTypesError ? (
        <StackItem>
          <Alert variant="danger" isInline title={t('Could not load host types')}>
            <Button variant="link" isInline onClick={() => void refetchHostTypes()}>
              {t('catalogProvision.actions.retry')}
            </Button>
          </Alert>
        </StackItem>
      ) : null}
      <StackItem>
        <Table aria-label={t('Node sets')} variant="compact">
          <Thead>
            <Tr>
              <Th>{t('Host type')}</Th>
              <Th>{t('Nodes')}</Th>
              <Th>{t('Actions')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {values.spec.nodeSetRows.length === 0 ? (
              <Tr>
                <Td colSpan={3}>{t('No node sets added yet.')}</Td>
              </Tr>
            ) : null}
            {values.spec.nodeSetRows.map((row, rowIndex) => (
              <Tr key={row.rowId}>
                <Td>
                  <SelectField
                    name={`spec.nodeSetRows.${rowIndex}.hostType`}
                    label={t('Host type')}
                    fieldId={`cluster-host-type-${row.rowId}`}
                    options={hostTypeOptionsForRow(rowIndex)}
                    isRequired
                    isLoading={hostTypesLoading}
                    placeholder={t('Select host type')}
                  />
                </Td>
                <Td>
                  <ClusterPoolSizeField rowIndex={rowIndex} isRequired />
                </Td>
                <Td>
                  <Button variant="link" onClick={() => removeRow(rowIndex)}>
                    {t('Remove')}
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </StackItem>
      <StackItem>
        <Button variant="secondary" onClick={addRow} isDisabled={hostTypesLoading}>
          {t('Add node set')}
        </Button>
      </StackItem>
    </Stack>
  );
};

export default ClusterNodeSetsTable;
