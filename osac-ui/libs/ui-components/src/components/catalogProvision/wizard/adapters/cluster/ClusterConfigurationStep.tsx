import { useMemo } from 'react';
import { FormSection, Stack, StackItem } from '@patternfly/react-core';

import type { ClusterCatalogItem } from '@osac/types';

import ClusterNodeSetsTable from './ClusterNodeSetsTable';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { InputField } from '../../../../Form/InputField';
import OsacForm from '../../../../Form/OsacForm';
import { getCatalogFieldOverlay, readCatalogFieldDefinitions } from '../../catalogOverlay';

interface Props {
  catalogItem: ClusterCatalogItem | null;
}

export const ClusterConfigurationStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();

  const definitions = useMemo(() => readCatalogFieldDefinitions(catalogItem), [catalogItem]);
  const releaseImageOverlay = useMemo(
    () => getCatalogFieldOverlay('release_image', definitions, t('Release image')),
    [definitions, t],
  );

  if (!catalogItem) {
    return null;
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <OsacForm>
          <InputField
            name="spec.releaseImage"
            label={releaseImageOverlay.label}
            fieldId="cluster-release-image"
            isRequired
            isDisabled={!releaseImageOverlay.editable}
          />
          <FormSection title={t('Node Sets')} titleElement="h2">
            <ClusterNodeSetsTable />
          </FormSection>
        </OsacForm>
      </StackItem>
    </Stack>
  );
};
