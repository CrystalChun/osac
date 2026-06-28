import { useEffect, useMemo } from 'react';
import { Alert, Button, Stack, StackItem } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { ComputeInstanceWizardValues } from './fields';
import {
  formatInstanceTypeOptionLabel,
  useInstanceTypes,
} from '../../../../../api/v1/instance-types';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { InputField } from '../../../../Form/InputField';
import OsacForm from '../../../../Form/OsacForm';
import { SelectField } from '../../../../Form/SelectField';
import {
  getCatalogFieldOverlay,
  hasCatalogFieldDefinition,
  readCatalogFieldDefinitions,
} from '../../catalogOverlay';
import { CATALOG_PROVISION_MULTILINE_TEXTAREA } from '../../constants';

interface Props {
  catalogItem: ComputeInstanceCatalogItem | null;
}

export const VmConfigurationStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ComputeInstanceWizardValues>();
  const instanceTypeId = values.spec.instanceType;

  const {
    data: instanceTypes = [],
    isPending: instanceTypesLoading,
    isError: instanceTypesError,
    refetch: refetchInstanceTypes,
  } = useInstanceTypes();

  const instanceTypeOptions = useMemo(
    () =>
      instanceTypes.map((instanceType) => ({
        value: instanceType.id,
        label: formatInstanceTypeOptionLabel(
          instanceType,
          t('catalogProvision.instanceTypes.deprecatedSuffix'),
        ),
      })),
    [instanceTypes, t],
  );

  useEffect(() => {
    if (instanceTypeOptions.length === 1 && !instanceTypeId) {
      void setFieldValue('spec.instanceType', instanceTypeOptions[0].value);
    }
  }, [instanceTypeId, instanceTypeOptions, setFieldValue]);

  const definitions = useMemo(
    () => readCatalogFieldDefinitions(catalogItem),
    [catalogItem],
  );

  const overlays = useMemo(
    () => ({
      image: getCatalogFieldOverlay(
        'spec.image.source_ref',
        definitions,
        t('catalogProvision.vm.fields.image'),
      ),
      userData: getCatalogFieldOverlay(
        'spec.user_data',
        definitions,
        t('catalogProvision.vm.fields.userData'),
      ),
      bootDisk: getCatalogFieldOverlay(
        'spec.boot_disk.size_gib',
        definitions,
        t('catalogProvision.vm.fields.bootDisk'),
      ),
      userDataRequired: hasCatalogFieldDefinition('spec.user_data', definitions),
    }),
    [definitions, t],
  );

  if (!catalogItem) {
    return null;
  }

  return (
    <Stack hasGutter>
      {instanceTypesError ? (
        <StackItem>
          <Alert variant="danger" isInline title={t('catalogProvision.instanceTypes.loadError')}>
            <Button variant="link" isInline onClick={() => void refetchInstanceTypes()}>
              {t('catalogProvision.actions.retry')}
            </Button>
          </Alert>
        </StackItem>
      ) : null}
      <StackItem>
        <OsacForm>
          <InputField
            name="spec.image.sourceRef"
            label={overlays.image.label}
            fieldId="vm-image-source-ref"
            isRequired
            helperText={t('catalogProvision.vm.fields.imageDescription')}
            isDisabled={!overlays.image.editable}
          />
          <SelectField
            name="spec.instanceType"
            label={t('catalogProvision.vm.fields.instanceType')}
            fieldId="vm-instance-type"
            isRequired
            isDisabled={instanceTypesLoading}
            placeholder={t('catalogProvision.vm.placeholders.selectInstanceType')}
            options={instanceTypeOptions}
          />
          <InputField
            name="spec.bootDisk.sizeGib"
            label={overlays.bootDisk.label}
            fieldId="vm-boot-disk-size"
            type="number"
            isRequired
            helperText={t('catalogProvision.vm.fields.bootDiskDescription')}
            isDisabled={!overlays.bootDisk.editable}
          />
          <InputField
            name="spec.userData"
            label={overlays.userData.label}
            fieldId="vm-user-data"
            multiline
            rows={CATALOG_PROVISION_MULTILINE_TEXTAREA.rows}
            resizeOrientation={CATALOG_PROVISION_MULTILINE_TEXTAREA.resizeOrientation}
            isRequired={overlays.userDataRequired}
            helperText={t('catalogProvision.vm.fields.userDataDescription')}
            isDisabled={!overlays.userData.editable}
          />
        </OsacForm>
      </StackItem>
    </Stack>
  );
};
