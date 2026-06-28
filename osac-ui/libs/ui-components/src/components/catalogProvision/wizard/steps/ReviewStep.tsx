import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { BuildComputeInstanceCreateBodyInput } from '../../../../api/v1/compute-instance-wire';
import {
  useSecurityGroups,
  useSubnets,
  useVirtualNetworks,
  virtualNetworkFilterForSubnetList,
} from '../../../../api/v1/networking';
import { useInstanceTypes } from '../../../../api/v1/instance-types';
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

export const ReviewStep = ({
  adapter,
  catalogItem,
  values,
}: Props) => {
  const { t } = useTranslation();
  const virtualNetworkId = values.spec.networking.virtualNetworkId;
  const subnetFilter = virtualNetworkId
    ? virtualNetworkFilterForSubnetList(virtualNetworkId)
    : undefined;
  const securityGroupFilter = subnetFilter;
  const { data: virtualNetworks = [] } = useVirtualNetworks();
  const { data: subnets = [] } = useSubnets(subnetFilter ? { filter: subnetFilter } : {}, {
    enabled: Boolean(virtualNetworkId),
  });
  const { data: securityGroups = [] } = useSecurityGroups(
    securityGroupFilter ? { filter: securityGroupFilter } : {},
    { enabled: Boolean(virtualNetworkId) },
  );
  const { data: instanceTypes = [] } = useInstanceTypes();
  const sections = catalogItem
    ? adapter.getReviewSections(values, catalogItem, {
        securityGroups,
        instanceTypes,
        virtualNetworks,
        subnets,
      })
    : [];
  const rows = sections.flatMap((section) => section.rows);

  return (
    <DescriptionList isHorizontal isCompact>
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
