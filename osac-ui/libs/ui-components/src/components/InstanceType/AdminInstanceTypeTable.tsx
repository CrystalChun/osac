import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Truncate,
} from '@patternfly/react-core';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { InstanceType as PrivateInstanceType } from '@osac/types/private';

import { InstanceTypeLifecycleLabel } from './InstanceTypeLifecycleLabel';
import { useTranslation } from '../../hooks/useTranslation';
import { Timestamp } from '../Primitives/Timestamp';

const INSTANCE_TYPE_DESCRIPTION_PREVIEW_LENGTH = 120;
const INSTANCE_TYPE_NAME_PREVIEW_LENGTH = 32;
const NAME_COLUMN_WIDTH = 15;
const LIFECYCLE_STATE_COLUMN_WIDTH = 10;
const CPU_CORES_COLUMN_WIDTH = 10;
const MEMORY_COLUMN_WIDTH = 10;
const DESCRIPTION_COLUMN_WIDTH = 40;
const CREATED_COLUMN_WIDTH = 15;
const EMPTY_STATE_COLUMN_SPAN = 6;

interface AdminInstanceTypeTableProps {
  instanceTypes: PrivateInstanceType[];
}

const AdminInstanceTypeTable = ({ instanceTypes }: AdminInstanceTypeTableProps) => {
  const { t } = useTranslation();

  return (
    <Table aria-label={t('Instance types')} variant="compact">
      <Thead>
        <Tr>
          <Th width={NAME_COLUMN_WIDTH}>{t('Name')}</Th>
          <Th width={LIFECYCLE_STATE_COLUMN_WIDTH}>{t('Lifecycle State')}</Th>
          <Th width={CPU_CORES_COLUMN_WIDTH}>{t('CPU cores')}</Th>
          <Th width={MEMORY_COLUMN_WIDTH}>{t('Memory (GiB)')}</Th>
          <Th width={DESCRIPTION_COLUMN_WIDTH}>{t('Description')}</Th>
          <Th width={CREATED_COLUMN_WIDTH}>{t('Created')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {instanceTypes.length === 0 ? (
          <Tr>
            <Td colSpan={EMPTY_STATE_COLUMN_SPAN}>
              <Bullseye>
                <EmptyState
                  headingLevel="h2"
                  titleText={t('No instance types yet.')}
                  icon={SearchIcon}
                  variant={EmptyStateVariant.sm}
                >
                  <EmptyStateBody>
                    {t('Create an instance type to start defining provider-managed sizes.')}
                  </EmptyStateBody>
                </EmptyState>
              </Bullseye>
            </Td>
          </Tr>
        ) : (
          instanceTypes.map((instanceType) => (
            <Tr key={instanceType.id}>
              <Td dataLabel={t('Name')} modifier="truncate" width={NAME_COLUMN_WIDTH}>
                <Truncate
                  content={(instanceType.metadata?.name || instanceType.id)
                    .replace(/\s+/g, ' ')
                    .trim()}
                  maxCharsDisplayed={INSTANCE_TYPE_NAME_PREVIEW_LENGTH}
                  omissionContent="..."
                />
              </Td>
              <Td dataLabel={t('Lifecycle State')} width={LIFECYCLE_STATE_COLUMN_WIDTH}>
                <InstanceTypeLifecycleLabel state={instanceType.spec?.state} />
              </Td>
              <Td dataLabel={t('CPU cores')} width={CPU_CORES_COLUMN_WIDTH}>
                {instanceType.spec?.cores ?? '—'}
              </Td>
              <Td dataLabel={t('Memory (GiB)')} width={MEMORY_COLUMN_WIDTH}>
                {instanceType.spec?.memoryGib ?? '—'}
              </Td>
              <Td dataLabel={t('Description')} modifier="truncate" width={DESCRIPTION_COLUMN_WIDTH}>
                <Truncate
                  content={(instanceType.spec?.description || '—').replace(/\s+/g, ' ').trim()}
                  maxCharsDisplayed={INSTANCE_TYPE_DESCRIPTION_PREVIEW_LENGTH}
                  omissionContent="..."
                />
              </Td>
              <Td dataLabel={t('Created')} width={CREATED_COLUMN_WIDTH}>
                <Timestamp value={instanceType.metadata?.creationTimestamp} />
              </Td>
            </Tr>
          ))
        )}
      </Tbody>
    </Table>
  );
};

export default AdminInstanceTypeTable;
