import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';

import { useTranslation } from '../../../../hooks/useTranslation';
import type { CatalogProvisionCatalogItem } from '../../catalogProvisionItem';
import type { CatalogProvisionAdapter } from '../adapters/types';

interface Props<
  TItem extends CatalogProvisionCatalogItem,
  TValues extends { catalogItemId: string },
  TPayload,
> {
  adapter: CatalogProvisionAdapter<TItem, TValues, TPayload>;
  catalogItem: TItem | null;
  values: TValues;
}

export const ReviewStep = <
  TItem extends CatalogProvisionCatalogItem,
  TValues extends { catalogItemId: string },
  TPayload,
>({
  adapter,
  catalogItem,
  values,
}: Props<TItem, TValues, TPayload>) => {
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
