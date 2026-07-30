import type { ComponentType } from 'react';
import type { SVGIconProps } from '@patternfly/react-icons/dist/esm/createIcon';
import CloudIcon from '@patternfly/react-icons/dist/esm/icons/cloud-icon';
import CogIcon from '@patternfly/react-icons/dist/esm/icons/cog-icon';
import CubeIcon from '@patternfly/react-icons/dist/esm/icons/cube-icon';
import NetworkIcon from '@patternfly/react-icons/dist/esm/icons/network-icon';
import ServerIcon from '@patternfly/react-icons/dist/esm/icons/server-icon';
import VirtualMachineIcon from '@patternfly/react-icons/dist/esm/icons/virtual-machine-icon';

const SHELL_NAV_ICONS: Record<string, ComponentType<SVGIconProps>> = {
  'compute-vms': VirtualMachineIcon,
  catalog: CubeIcon,
  clusters: CloudIcon,
  'bare-metal': ServerIcon,
  'virtual-networks': NetworkIcon,
  'catalog-management': CogIcon,
};

export const shellNavIcon = (itemId: string) => {
  const Icon = SHELL_NAV_ICONS[itemId];
  return Icon ? <Icon aria-hidden /> : undefined;
};

interface CatalogItemIconProps {
  kind:
    | 'osac.public.v1.ClusterCatalogItem'
    | 'osac.public.v1.BareMetalInstanceCatalogItem'
    | 'osac.public.v1.ComputeInstanceCatalogItem';
}

export const CatalogItemIcon = ({ kind }: CatalogItemIconProps) => {
  let Icon = VirtualMachineIcon;
  switch (kind) {
    case 'osac.public.v1.ClusterCatalogItem':
      Icon = CloudIcon;
      break;
    case 'osac.public.v1.BareMetalInstanceCatalogItem':
      Icon = ServerIcon;
      break;
    default:
      Icon = VirtualMachineIcon;
  }
  return <Icon aria-hidden className="pf-v6-u-font-size-lg" />;
};
