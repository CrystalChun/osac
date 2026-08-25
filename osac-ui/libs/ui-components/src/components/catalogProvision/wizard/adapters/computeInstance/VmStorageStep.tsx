import { useMemo, useState } from 'react';
import { FieldArray, useFormikContext } from 'formik';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import { AdditionalDiskEditor } from './AdditionalDiskEditor';
import { AdditionalDisksList } from './AdditionalDisksList';
import type { ComputeInstanceDiskValues, ComputeInstanceWizardValues } from './fields';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { InputField } from '../../../../Form/InputField';
import OsacForm from '../../../../Form/OsacForm';
import { StorageTierSelectField } from '../../../../Form/StorageTierSelectField';
import { getCatalogFieldOverlay, readCatalogFieldDefinitions } from '../../catalogOverlay';

interface Props {
  catalogItem: ComputeInstanceCatalogItem | null;
}

type EditorMode = 'add' | 'edit';

interface EditorState {
  index: number;
  mode: EditorMode;
  /** Row values captured on Edit, restored on Cancel. Unused (null) in 'add' mode — Cancel there removes the pushed row instead. */
  snapshot: ComputeInstanceDiskValues | null;
}

export const VmStorageStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<ComputeInstanceWizardValues>();

  const [editor, setEditor] = useState<EditorState | null>(null);

  const definitions = useMemo(() => readCatalogFieldDefinitions(catalogItem), [catalogItem]);

  const bootDiskOverlay = useMemo(
    () => getCatalogFieldOverlay('spec.boot_disk.size_gib', definitions, t('Boot disk')),
    [definitions, t],
  );
  const storageTierOverlay = useMemo(
    () => getCatalogFieldOverlay('spec.boot_disk.storage_tier', definitions, t('Storage tier')),
    [definitions, t],
  );

  if (!catalogItem) {
    return null;
  }

  return (
    <OsacForm>
      <InputField
        name="spec.bootDisk.sizeGib"
        label={bootDiskOverlay.label}
        fieldId="vm-boot-disk-size"
        type="number"
        isRequired
        helperText={t('Size in GiB')}
        isDisabled={!bootDiskOverlay.editable}
      />
      <StorageTierSelectField
        name="spec.bootDisk.storageTier"
        label={storageTierOverlay.label}
        fieldId="vm-boot-disk-storage-tier"
        isLocked={!storageTierOverlay.editable}
      />
      <FieldArray name="spec.additionalDisks">
        {(helpers) => {
          const handleAdd = () => {
            const newIndex = values.spec.additionalDisks.length;
            helpers.push({ sizeGib: '30', storageTier: '' });
            setEditor({ index: newIndex, mode: 'add', snapshot: null });
          };

          const handleEdit = (index: number) => {
            setEditor({
              index,
              mode: 'edit',
              snapshot: { ...values.spec.additionalDisks[index] },
            });
          };

          const handleConfirm = () => {
            setEditor(null);
          };

          const handleCancel = () => {
            if (!editor) {
              return;
            }
            if (editor.mode === 'add') {
              helpers.remove(editor.index);
            } else if (editor.snapshot) {
              helpers.replace(editor.index, editor.snapshot);
            }
            setEditor(null);
          };

          const handleDelete = (index: number) => {
            helpers.remove(index);
            setEditor((current) => {
              if (!current || index === current.index) {
                return null;
              }
              return index < current.index ? { ...current, index: current.index - 1 } : current;
            });
          };

          return (
            <>
              <AdditionalDisksList
                disks={values.spec.additionalDisks}
                editingIndex={editor?.index ?? null}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              {editor && (
                <AdditionalDiskEditor
                  index={editor.index}
                  mode={editor.mode}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                />
              )}
            </>
          );
        }}
      </FieldArray>
    </OsacForm>
  );
};
