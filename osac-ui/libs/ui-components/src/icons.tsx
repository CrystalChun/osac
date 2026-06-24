import type { ComponentType } from 'react';
import type { SVGIconProps } from '@patternfly/react-icons/dist/esm/createIcon';
import BuildingIcon from '@patternfly/react-icons/dist/esm/icons/building-icon';
import CloudIcon from '@patternfly/react-icons/dist/esm/icons/cloud-icon';
import ClusterIcon from '@patternfly/react-icons/dist/esm/icons/cluster-icon';
import CubeIcon from '@patternfly/react-icons/dist/esm/icons/cube-icon';
import GlobeIcon from '@patternfly/react-icons/dist/esm/icons/globe-icon';
import NetworkIcon from '@patternfly/react-icons/dist/esm/icons/network-icon';
import TachometerAltIcon from '@patternfly/react-icons/dist/esm/icons/tachometer-alt-icon';
import UsersIcon from '@patternfly/react-icons/dist/esm/icons/users-icon';
import VirtualMachineIcon from '@patternfly/react-icons/dist/esm/icons/virtual-machine-icon';

import type { CatalogItemKind } from './components/catalog/catalogItemDisplay';

const SHELL_NAV_ICONS: Record<string, ComponentType<SVGIconProps>> = {
  'compute-vms': VirtualMachineIcon,
  catalog: CubeIcon,
  clusters: CloudIcon,
  'admin-dashboard': TachometerAltIcon,
  'admin-users': UsersIcon,
  'admin-catalog': CubeIcon,
  'admin-networks': NetworkIcon,
  'provider-dashboard': TachometerAltIcon,
  'provider-orgs': BuildingIcon,
  'provider-catalog': GlobeIcon,
  'provider-infra': ClusterIcon,
};

export const shellNavIcon = (itemId: string) => {
  const Icon = SHELL_NAV_ICONS[itemId];
  return Icon ? <Icon aria-hidden /> : undefined;
};

interface CatalogItemIconProps {
  kind: CatalogItemKind;
}

export const CatalogItemIcon = ({ kind }: CatalogItemIconProps) => {
  const Icon = kind === 'cluster' ? CloudIcon : VirtualMachineIcon;
  return <Icon aria-hidden className="pf-v6-u-font-size-lg" />;
};
