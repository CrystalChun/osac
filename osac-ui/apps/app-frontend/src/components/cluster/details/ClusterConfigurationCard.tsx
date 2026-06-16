import {
  Card,
  CardBody,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { Cluster } from '@osac/types';
import { Timestamp } from '@osac/ui-components/Timestamp';

import { displayValue } from '../../resource/detailFormatters';

interface ClusterConfigurationCardProps {
  cluster: Cluster;
}

export const ClusterConfigurationCard = ({ cluster }: ClusterConfigurationCardProps) => {
  const nodeSetEntries = Object.entries(cluster.spec?.nodeSets ?? {});

  return (
    <Card isFullHeight>
      <CardTitle>Cluster configuration</CardTitle>
      <CardBody>
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Catalog item</DescriptionListTerm>
            <DescriptionListDescription>
              {displayValue(cluster.spec?.catalogItem)}
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

        {nodeSetEntries.length > 0 ? (
          <>
            <Content component="h3">Node sets</Content>
            <Table aria-label="Cluster node sets" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Host type</Th>
                  <Th>Size</Th>
                </Tr>
              </Thead>
              <Tbody>
                {nodeSetEntries.map(([key, nodeSet]) => (
                  <Tr key={key}>
                    <Td dataLabel="Name">{key}</Td>
                    <Td dataLabel="Host type">{displayValue(nodeSet.hostType)}</Td>
                    <Td dataLabel="Size">{nodeSet.size}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </>
        ) : (
          <Content component="p">No node sets configured.</Content>
        )}
      </CardBody>
    </Card>
  );
};
