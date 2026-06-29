import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Skeleton,
} from '@patternfly/react-core';

import type { Cluster } from '@osac/types';

import { useClusterCatalogItem } from '../../../api/v1/cluster-catalog-item';
import { displayValue } from '../../../utils/detailFormatters';
import { Timestamp } from '../../Primitives/Timestamp';

interface ClusterConfigurationCardProps {
  cluster: Cluster;
}

export const ClusterConfigurationCard = ({ cluster }: ClusterConfigurationCardProps) => {
  const catalogItemId = cluster.spec?.catalogItem;
  const { data: catalogItem, isLoading: isCatalogItemLoading } =
    useClusterCatalogItem(catalogItemId);

  return (
    <Card isFullHeight>
      <CardTitle>Cluster configuration</CardTitle>
      <CardBody>
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Catalog item</DescriptionListTerm>
            <DescriptionListDescription>
              {isCatalogItemLoading ? (
                <Skeleton width="150px" />
              ) : (
                displayValue(catalogItem?.metadata?.name ?? catalogItemId)
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Release image</DescriptionListTerm>
            <DescriptionListDescription>
              {displayValue(cluster.spec?.releaseImage)}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Pod CIDR</DescriptionListTerm>
            <DescriptionListDescription>
              {displayValue(cluster.spec?.network?.podCidr)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Service CIDR</DescriptionListTerm>
            <DescriptionListDescription>
              {displayValue(cluster.spec?.network?.serviceCidr)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Created</DescriptionListTerm>
            <DescriptionListDescription>
              <Timestamp value={cluster.metadata?.creationTimestamp} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Creator</DescriptionListTerm>
            <DescriptionListDescription>
              {displayValue(cluster.metadata?.creator)}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};
