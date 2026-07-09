import type { ClusterCatalogItem } from '@osac/types';

import { useTranslation } from '../../../../hooks/useTranslation';
import { InputField } from '../../../Form/InputField';
import { getCatalogFieldOverlay, readCatalogFieldDefinitions } from '../catalogOverlay';
import { CATALOG_PROVISION_MULTILINE_TEXTAREA } from '../constants';

interface PullSecretFieldProps {
  catalogItem: ClusterCatalogItem | null;
}

const PullSecretField = ({ catalogItem }: PullSecretFieldProps) => {
  const { t } = useTranslation();
  const definitions = readCatalogFieldDefinitions(catalogItem);
  const overlay = getCatalogFieldOverlay('pull_secret', definitions, t('Pull secret'));

  return (
    <InputField
      name="spec.pullSecret"
      label={overlay.label}
      fieldId="spec-pullSecret"
      isRequired
      isDisabled={!overlay.editable}
      multiline
      rows={CATALOG_PROVISION_MULTILINE_TEXTAREA.rows}
      resizeOrientation={CATALOG_PROVISION_MULTILINE_TEXTAREA.resizeOrientation}
      type="password"
      helperText={t(
        'Pull secrets download OpenShift components and connect clusters to your Red Hat account. Copy the full JSON from OpenShift Cluster Manager (console.redhat.com/openshift/install/pull-secret).',
      )}
    />
  );
};

export default PullSecretField;
