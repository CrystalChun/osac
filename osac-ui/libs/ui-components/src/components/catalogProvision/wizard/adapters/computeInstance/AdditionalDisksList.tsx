import { useMemo } from 'react';
import { Button } from '@patternfly/react-core';
import PlusCircleIcon from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ComputeInstanceDiskValues } from './fields';
import {
  STORAGE_TIER_ACTIVE_LIST_FILTER,
  usePrivateStorageTiers,
} from '../../../../../api/v1/private/storage-tiers';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { SubtleContent } from '../../../../SubtleContent/SubtleContent';

interface AdditionalDisksListProps {
  disks: ComputeInstanceDiskValues[];
  /** The row currently open in the inline editor — hidden from this list while open. */
  editingIndex: number | null;
  onAdd: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export const AdditionalDisksList = ({
  disks,
  editingIndex,
  onAdd,
  onEdit,
  onDelete,
}: AdditionalDisksListProps) => {
  const { t } = useTranslation();
  const { data: tiers = [] } = usePrivateStorageTiers({ filter: STORAGE_TIER_ACTIVE_LIST_FILTER });

  const tierDisplayNameByName = useMemo(
    () => new Map(tiers.map((tier) => [tier.metadata?.name ?? '', tier.metadata?.displayName])),
    [tiers],
  );

  // Add/Edit are disabled while an editor is open to prevent re-entrancy (a second draft row,
  // or silently discarding an in-progress edit by switching targets). Delete stays enabled —
  // it only ever targets a different row (the one being edited is filtered out below), so it
  // can't disturb the open editor's uncommitted state.
  const isEditorOpen = editingIndex !== null;

  const rows = disks
    .map((disk, index) => ({ disk, index }))
    .filter(({ index }) => index !== editingIndex);

  const addButton = (
    <Button variant="primary" icon={<PlusCircleIcon />} onClick={onAdd} isDisabled={isEditorOpen}>
      {t('Add disk')}
    </Button>
  );

  if (rows.length === 0) {
    return (
      <div>
        <SubtleContent component="p">{t('No additional disks added.')}</SubtleContent>
        {addButton}
      </div>
    );
  }

  return (
    <div>
      {addButton}
      <Table aria-label={t('Additional disks')} variant="compact" borders>
        <Thead>
          <Tr>
            <Th>{t('Size (GiB)')}</Th>
            <Th>{t('Storage tier')}</Th>
            <Th>{t('Actions')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map(({ disk, index }) => (
            <Tr key={index}>
              <Td dataLabel={t('Size (GiB)')}>{disk.sizeGib}</Td>
              <Td dataLabel={t('Storage tier')}>
                {tierDisplayNameByName.get(disk.storageTier) || disk.storageTier}
              </Td>
              <Td dataLabel={t('Actions')}>
                <Button
                  variant="link"
                  isInline
                  isDisabled={isEditorOpen}
                  onClick={() => onEdit(index)}
                >
                  {t('Edit')}
                </Button>
                {' | '}
                <Button variant="link" isInline isDanger onClick={() => onDelete(index)}>
                  {t('Delete')}
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  );
};
