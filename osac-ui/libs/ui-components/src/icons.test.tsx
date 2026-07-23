import CloudIcon from '@patternfly/react-icons/dist/esm/icons/cloud-icon';
import ServerIcon from '@patternfly/react-icons/dist/esm/icons/server-icon';
import VirtualMachineIcon from '@patternfly/react-icons/dist/esm/icons/virtual-machine-icon';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CatalogItemIcon } from './icons';

const renderedIconPath = (ui: React.ReactElement) =>
  render(ui).container.querySelector('svg path')?.getAttribute('d');

describe('CatalogItemIcon', () => {
  it.each([
    ['osac.public.v1.ClusterCatalogItem', CloudIcon],
    ['osac.private.v1.ClusterCatalogItem', CloudIcon],
    ['osac.public.v1.BareMetalInstanceCatalogItem', ServerIcon],
    ['osac.private.v1.BareMetalInstanceCatalogItem', ServerIcon],
    ['osac.public.v1.ComputeInstanceCatalogItem', VirtualMachineIcon],
    ['osac.private.v1.ComputeInstanceCatalogItem', VirtualMachineIcon],
  ] as const)('renders the expected icon for kind %s', (kind, ExpectedIcon) => {
    expect(renderedIconPath(<CatalogItemIcon kind={kind} />)).toBe(
      renderedIconPath(<ExpectedIcon />),
    );
  });
});
