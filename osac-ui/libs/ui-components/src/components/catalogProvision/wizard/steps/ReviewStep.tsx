import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { BuildComputeInstanceCreateBodyInput } from '../../../../api/v1/compute-instance-wire';
import { useTranslation } from '../../../../hooks/useTranslation';
import type { ComputeInstanceWizardValues } from '../adapters/computeInstance/fields';
import type { CatalogProvisionAdapter } from '../adapters/types';

interface Props {
  adapter: CatalogProvisionAdapter<
    ComputeInstanceCatalogItem,
    ComputeInstanceWizardValues,
    BuildComputeInstanceCreateBodyInput
  >;
  catalogItem: ComputeInstanceCatalogItem | null;
  values: ComputeInstanceWizardValues;
}

export const ReviewStep = ({ adapter, catalogItem, values }: Props) => {
  const { t } = useTranslation();
  const sections = catalogItem ? adapter.getReviewSections(values, catalogItem) : [];
  const rows = sections.flatMap((section) => section.rows);

  return (
    <DescriptionList isHorizontal isCompact aria-label={t('catalogProvision.steps.review.title')}>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('catalogProvision.review.catalogItem')}</DescriptionListTerm>
        <DescriptionListDescription>{catalogItem?.title ?? '—'}</DescriptionListDescription>
      </DescriptionListGroup>
      {rows.map((row) => (
        <DescriptionListGroup key={row.label}>
          <DescriptionListTerm>{row.label}</DescriptionListTerm>
          <DescriptionListDescription>{row.value}</DescriptionListDescription>
        </DescriptionListGroup>
      ))}
    </DescriptionList>
  );
};
