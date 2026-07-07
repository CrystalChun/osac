import { useEffect, useMemo } from 'react';
import { Alert, Button, Stack, StackItem } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useFormikContext } from 'formik';

import type { ClusterCatalogItem } from '@osac/types';

import { type ClusterWizardValues, buildNodeSetsFromTemplate } from './fields';
import { useClusterTemplate } from '../../../../../api/v1/cluster-templates';
import { hostTypeDisplayName, useHostType } from '../../../../../api/v1/host-types';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { InputField } from '../../../../Form/InputField';
import OsacForm from '../../../../Form/OsacForm';
import { getCatalogFieldOverlay, readCatalogFieldDefinitions } from '../../catalogOverlay';

interface Props {
  catalogItem: ClusterCatalogItem | null;
}

const ClusterPoolHostTypeLabel = ({ hostTypeId }: { hostTypeId: string }) => {
  const { data: hostType } = useHostType(hostTypeId);
  if (!hostType) {
    return hostTypeId;
  }
  return hostTypeDisplayName(hostType);
};

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
    () =>
      getCatalogFieldOverlay(
        'release_image',
        definitions,
        t('catalogProvision.cluster.fields.releaseImage'),
      ),
    [definitions, t],
  );

  const poolNames = useMemo(() => Object.keys(template?.nodeSets ?? {}), [template]);
  const hasEmptyTemplatePools = Boolean(template && poolNames.length === 0);

  useEffect(() => {
    if (!template || poolNames.length === 0) {
      return;
    }
    if (Object.keys(values.spec.nodeSets).length > 0) {
      return;
    }
    void setFieldValue('spec.nodeSets', buildNodeSetsFromTemplate(template));
  }, [poolNames.length, setFieldValue, template, values.spec.nodeSets]);

  if (!catalogItem) {
    return null;
  }

  return (
    <Stack hasGutter>
      {templateError ? (
        <StackItem>
          <Alert variant="danger" isInline title={t('catalogProvision.cluster.templateLoadError')}>
            <Button variant="link" isInline onClick={() => void refetchTemplate()}>
              {t('catalogProvision.actions.retry')}
            </Button>
          </Alert>
        </StackItem>
      ) : null}
      {hasEmptyTemplatePools ? (
        <StackItem>
          <Alert
            variant="warning"
            isInline
            title={t('catalogProvision.cluster.emptyNodeSetsTitle')}
          >
            {t('catalogProvision.cluster.emptyNodeSetsDescription')}
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
        </OsacForm>
      </StackItem>
      <StackItem>
        <Table aria-label={t('catalogProvision.cluster.nodeSetsTableAria')} variant="compact">
          <Thead>
            <Tr>
              <Th>{t('catalogProvision.cluster.fields.poolName')}</Th>
              <Th>{t('catalogProvision.cluster.fields.hostType')}</Th>
              <Th>{t('catalogProvision.cluster.fields.poolSize')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {templateLoading ? (
              <Tr>
                <Td colSpan={3}>{t('catalogProvision.common.loading')}</Td>
              </Tr>
            ) : null}
            {!templateLoading && poolNames.length === 0 ? (
              <Tr>
                <Td colSpan={3}>{t('catalogProvision.cluster.noWorkerPools')}</Td>
              </Tr>
            ) : null}
            {poolNames.map((poolName) => {
              const pool = values.spec.nodeSets[poolName];
              const hostTypeId = pool?.hostType ?? template?.nodeSets?.[poolName]?.hostType ?? '';
              return (
                <Tr key={poolName}>
                  <Td dataLabel={t('catalogProvision.cluster.fields.poolName')}>{poolName}</Td>
                  <Td dataLabel={t('catalogProvision.cluster.fields.hostType')}>
                    <ClusterPoolHostTypeLabel hostTypeId={hostTypeId} />
                  </Td>
                  <Td dataLabel={t('catalogProvision.cluster.fields.poolSize')}>
                    <InputField
                      name={`spec.nodeSets.${poolName}.size`}
                      label={t('catalogProvision.cluster.fields.poolSize')}
                      fieldId={`cluster-pool-size-${poolName}`}
                      isRequired={poolNames.length > 0}
                      type="number"
                    />
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </StackItem>
    </Stack>
  );
};
