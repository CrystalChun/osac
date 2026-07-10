import { useMemo } from 'react';

import type { BareMetalInstanceCatalogItem } from '@osac/types';

import { useTranslation } from '../../../../../hooks/useTranslation';
import { InputField } from '../../../../Form/InputField';
import OsacForm from '../../../../Form/OsacForm';
import { getCatalogFieldOverlay, readCatalogFieldDefinitions } from '../../catalogOverlay';
import { CATALOG_PROVISION_MULTILINE_TEXTAREA } from '../../constants';

interface Props {
  catalogItem: BareMetalInstanceCatalogItem | null;
}

const BareMetalConfigurationStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();

  const definitions = useMemo(() => readCatalogFieldDefinitions(catalogItem), [catalogItem]);

  const overlays = useMemo(
    () => ({
      userData: getCatalogFieldOverlay('spec.user_data', definitions, t('User data')),
    }),
    [definitions, t],
  );

  if (!catalogItem) {
    return null;
  }

  return (
    <OsacForm>
      <InputField
        name="spec.userData"
        label={overlays.userData.label}
        fieldId="bm-user-data"
        multiline
        rows={CATALOG_PROVISION_MULTILINE_TEXTAREA.rows}
        resizeOrientation={CATALOG_PROVISION_MULTILINE_TEXTAREA.resizeOrientation}
        helperText={t('Optional cloud-init user data (max 64 KB).')}
        isDisabled={!overlays.userData.editable}
      />
    </OsacForm>
  );
};

export default BareMetalConfigurationStep;
