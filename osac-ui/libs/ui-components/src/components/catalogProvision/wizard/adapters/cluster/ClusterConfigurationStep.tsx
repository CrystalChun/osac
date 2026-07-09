import { useEffect, useMemo } from 'react';
import { Alert, Button, FormSection, Stack, StackItem } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import type { ClusterCatalogItem } from '@osac/types';

import ClusterNodeSetsTable from './ClusterNodeSetsTable';
import { type ClusterWizardValues, buildNodeSetsFromTemplate } from './fields';
import { useClusterTemplate } from '../../../../../api/v1/cluster-templates';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { InputField } from '../../../../Form/InputField';
import OsacForm from '../../../../Form/OsacForm';
import { getCatalogFieldOverlay, readCatalogFieldDefinitions } from '../../catalogOverlay';

interface Props {
  catalogItem: ClusterCatalogItem | null;
}

export const ClusterConfigurationStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ClusterWizardValues>();
  const templateId = catalogItem?.template?.trim() ?? '';
  const {
    data: template,
    isPending: templateLoading,
    isError: templateError,
    refetch: refetchTemplate,
  } = useClusterTemplate(templateId || undefined);

  const definitions = useMemo(() => readCatalogFieldDefinitions(catalogItem), [catalogItem]);
  const releaseImageOverlay = useMemo(
    () => getCatalogFieldOverlay('release_image', definitions, t('Release image')),
    [definitions, t],
  );

  const poolNames = useMemo(() => Object.keys(template?.nodeSets ?? {}), [template]);
  const hasEmptyTemplatePools = Boolean(template && poolNames.length === 0);

  useEffect(() => {
    if (!templateId) {
      void setFieldValue('templateState', { resolved: true, poolNames: [] }, false);
      return;
    }
    if (templateLoading) {
      void setFieldValue('templateState', { resolved: false, poolNames: [] }, false);
      return;
    }
    if (templateError) {
      void setFieldValue('templateState', { resolved: false, poolNames: [] }, false);
      return;
    }
    if (!template) {
      return;
    }
    void setFieldValue('templateState', { resolved: true, poolNames }, false);
    if (poolNames.length > 0 && Object.keys(values.spec.nodeSets).length === 0) {
      void setFieldValue('spec.nodeSets', buildNodeSetsFromTemplate(template));
    }
  }, [
    poolNames,
    setFieldValue,
    template,
    templateError,
    templateId,
    templateLoading,
    values.spec.nodeSets,
  ]);

  if (!catalogItem) {
    return null;
  }

  return (
    <Stack hasGutter>
      {templateError ? (
        <StackItem>
          <Alert variant="danger" isInline title={t('Could not load cluster template')}>
            <Button variant="link" isInline onClick={() => void refetchTemplate()}>
              {t('catalogProvision.actions.retry')}
            </Button>
          </Alert>
        </StackItem>
      ) : null}
      {hasEmptyTemplatePools ? (
        <StackItem>
          <Alert variant="warning" isInline title={t('No node sets in template')}>
            {t(
              'This catalog template has no node sets defined. You can continue, but the cluster may fail to provision without node sets.',
            )}
          </Alert>
        </StackItem>
      ) : null}
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
            <ClusterNodeSetsTable
              templateLoading={templateLoading}
              poolNames={poolNames}
              template={template}
              nodeSets={values.spec.nodeSets}
            />
          </FormSection>
        </OsacForm>
      </StackItem>
    </Stack>
  );
};
