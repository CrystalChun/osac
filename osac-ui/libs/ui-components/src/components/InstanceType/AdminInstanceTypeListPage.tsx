import { Truncate } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { InstanceTypeLifecycleLabel } from './InstanceTypeLifecycleLabel';
import { useAdminInstanceTypes } from '../../api/v1/private/instance-type';
import { useTranslation } from '../../hooks/useTranslation';
import ListPage from '../Page/ListPage';
import ListPageBody from '../Page/ListPageBody';
import { Timestamp } from '../Primitives/Timestamp';
import { SubtleContent } from '../SubtleContent/SubtleContent';

const INSTANCE_TYPE_DESCRIPTION_PREVIEW_LENGTH = 120;
const INSTANCE_TYPE_NAME_PREVIEW_LENGTH = 32;
const NAME_COLUMN_WIDTH = 15;
const LIFECYCLE_STATE_COLUMN_WIDTH = 10;
const CPU_CORES_COLUMN_WIDTH = 10;
const MEMORY_COLUMN_WIDTH = 10;
const DESCRIPTION_COLUMN_WIDTH = 40;
const CREATED_COLUMN_WIDTH = 15;

const AdminInstanceTypeListPage = () => {
  const { t } = useTranslation();
  const { data: instanceTypes = [], isLoading, error } = useAdminInstanceTypes();

  return (
    <ListPage
      title={t('Instance types')}
      description={t('Manage provider-defined instance types for this cloud platform.')}
      error={error}
    >
      <ListPageBody isLoading={isLoading} error={error}>
        {instanceTypes.length === 0 ? (
          <SubtleContent component="p">{t('No instance types yet.')}</SubtleContent>
        ) : (
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
              {instanceTypes.map((instanceType) => (
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
                  <Td
                    dataLabel={t('Description')}
                    modifier="truncate"
                    width={DESCRIPTION_COLUMN_WIDTH}
                  >
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
              ))}
            </Tbody>
          </Table>
        )}
      </ListPageBody>
    </ListPage>
  );
};

export default AdminInstanceTypeListPage;
