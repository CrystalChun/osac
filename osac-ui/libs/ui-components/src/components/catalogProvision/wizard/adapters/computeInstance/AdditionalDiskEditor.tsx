import { Button, Split, SplitItem } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import type { ComputeInstanceWizardValues } from './fields';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { InputField } from '../../../../Form/InputField';
import { StorageTierSelectField } from '../../../../Form/StorageTierSelectField';

interface AdditionalDiskEditorProps {
  /** Position in spec.additionalDisks this editor is currently bound to. */
  index: number;
  mode: 'add' | 'edit';
  onConfirm: () => void;
  onCancel: () => void;
}

const ADDITIONAL_DISK_MIN_SIZE_GIB = 1;
const ADDITIONAL_DISK_MAX_SIZE_GIB = 16384;

export const AdditionalDiskEditor = ({
  index,
  mode,
  onConfirm,
  onCancel,
}: AdditionalDiskEditorProps) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<ComputeInstanceWizardValues>();
  const disk = values.spec.additionalDisks[index];
  const size = Number(disk?.sizeGib);

  const isValid =
    Number.isInteger(size) &&
    size >= ADDITIONAL_DISK_MIN_SIZE_GIB &&
    size <= ADDITIONAL_DISK_MAX_SIZE_GIB &&
    Boolean(disk?.storageTier);

  return (
    <>
      <InputField
        name={`spec.additionalDisks.${index}.sizeGib`}
        label={t('Size (GiB)')}
        fieldId={`vm-additional-disk-${index}-size`}
        type="number"
        isRequired
        min={ADDITIONAL_DISK_MIN_SIZE_GIB}
        max={ADDITIONAL_DISK_MAX_SIZE_GIB}
        step={1}
        helperText={t('Size in GiB')}
      />
      <StorageTierSelectField
        name={`spec.additionalDisks.${index}.storageTier`}
        label={t('Storage tier')}
        fieldId={`vm-additional-disk-${index}-storage-tier`}
        isRequired
      />
      <Split hasGutter>
        <SplitItem>
          <Button variant="primary" isDisabled={!isValid} onClick={onConfirm}>
            {mode === 'edit' ? t('Save') : t('Add')}
          </Button>
        </SplitItem>
        <SplitItem>
          <Button variant="link" onClick={onCancel}>
            {t('Cancel')}
          </Button>
        </SplitItem>
      </Split>
    </>
  );
};
