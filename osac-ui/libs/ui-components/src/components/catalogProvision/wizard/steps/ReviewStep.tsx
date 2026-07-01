import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { BuildComputeInstanceCreateBodyInput } from '../../../../api/v1/compute-instance-wire';
import { useInstanceTypes } from '../../../../api/v1/instance-types';
import {
  VIRTUAL_NETWORK_READY_LIST_FILTER,
  securityGroupFilterForVirtualNetworkList,
  useSecurityGroups,
  useSubnets,
  useVirtualNetworks,
  virtualNetworkFilterForSubnetList,
} from '../../../../api/v1/networking';
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
  const virtualNetworkId = values.spec.networking.virtualNetworkId;
  const subnetFilter = virtualNetworkId
    ? virtualNetworkFilterForSubnetList(virtualNetworkId)
    : undefined;
  const securityGroupFilter = virtualNetworkId
    ? securityGroupFilterForVirtualNetworkList(virtualNetworkId)
    : undefined;
  const { data: virtualNetworks = [] } = useVirtualNetworks({
    filter: VIRTUAL_NETWORK_READY_LIST_FILTER,
  });
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
