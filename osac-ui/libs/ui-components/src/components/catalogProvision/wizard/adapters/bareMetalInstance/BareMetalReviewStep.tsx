import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { CatalogItem } from '@osac/ui-components/components/catalog/catalogItemDisplay';

import { BareMetalInstanceWizardValues } from './fields';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { formatReviewScalar } from '../../catalogOverlay';

interface Props {
  catalogItem: CatalogItem | null;
}

export const BareMetalReviewStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<BareMetalInstanceWizardValues>();

  return (
    <DescriptionList isHorizontal isCompact aria-label={t('catalogProvision.steps.review.title')}>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Catalog item')}</DescriptionListTerm>
        <DescriptionListDescription>
          {catalogItem?.title || catalogItem?.metadata?.name || '—'}
        </DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
        <DescriptionListDescription>
          {formatReviewScalar(values.metadata.name)}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('SSH public key')}</DescriptionListTerm>
        <DescriptionListDescription>
          {formatReviewScalar(values.spec.sshKey)}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('User data')}</DescriptionListTerm>
        <DescriptionListDescription>
          {formatReviewScalar(values.spec.userData, true)}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};
