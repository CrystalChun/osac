import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ComputeInstanceCatalogItem } from '@osac/types';
import {
  InstanceTypeState,
  SecurityGroupState,
  SubnetState,
  VirtualNetworkState,
} from '@osac/types';

import { createMockApiFetch } from './test/createMockApiFetch';
import { vmCatalogItem } from './test/fixtures';
import { renderWizard } from './test/renderWizard';
import {
  advanceToConfigurationStep,
  advanceToNetworkingStep,
  advanceToReviewStep,
  clickWizardBack,
  clickWizardCancel,
  clickWizardNext,
  expectCatalogItemSelected,
  expectCatalogItemVisible,
  expectValidationAlert,
  fillGeneralStep,
  getCancelModal,
  selectCatalogItem,
  selectNetworkingPickers,
  waitForConfigurationReady,
} from './test/wizardFlow.helpers';
import type { ApiFetch } from '../../api/types';

const catalogItemWithDistinctDefaults = {
  ...vmCatalogItem,
  fieldDefinitions: [
    {
      path: 'spec.image.source_ref',
      displayName: 'VM image',
      editable: true,
      default: 'quay.io/example/rhel9',
    },
  ],
} as unknown as ComputeInstanceCatalogItem;

/** REST list response shape from fulfillment API (spec-relative paths, no `spec.` prefix). */
const wireFormatCatalogItem = {
  id: 'catalog-rhel-9',
  metadata: { name: 'catalog-rhel-9' },
  title: 'RHEL 9 catalog',
  description: 'RHEL 9 base image',
  template: 'tpl-rhel-9',
  published: true,
  field_definitions: [
    {
      path: 'image.source_ref',
      display_name: 'VM image',
      editable: true,
      default: { string_value: 'quay.io/example/rhel9' },
    },
    {
      path: 'boot_disk.size_gib',
      display_name: 'Boot disk',
      editable: true,
      default: { number_value: 40 },
    },
  ],
};

const expectConfigurationDefaults = async () => {
  await waitFor(() => {
    expect(screen.getByLabelText(/VM image/)).toHaveValue('quay.io/example/rhel9');
  });
};

const expectWireFormatConfigurationDefaults = async () => {
  await expectConfigurationDefaults();
  await waitFor(() => {
    const bootDisk = screen.getByLabelText(/Boot disk/) as HTMLInputElement;
    expect(bootDisk.value).toBe('40');
  });
};

describe('CatalogProvisionWizard', () => {
  it('blocks Next on catalog step when no catalog item is selected', async () => {
    const { user } = await renderWizard();

    await expectCatalogItemVisible('RHEL 9 catalog');

    await clickWizardNext(user);
    await expectValidationAlert();
    expect(screen.getByText('Select a catalog item')).toBeInTheDocument();
    await expectCatalogItemVisible('RHEL 9 catalog');
  });

  it('blocks Next on general step when name is empty', async () => {
    const { user } = await renderWizard();

    await selectCatalogItem(user);
    await clickWizardNext(user);
    await waitFor(() => {
      expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();
    });

    await clickWizardNext(user);
    await expectValidationAlert();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('prefills configuration fields from catalog item defaults after selection', async () => {
    const { user } = await renderWizard({
      apiFixtures: { catalogItems: [catalogItemWithDistinctDefaults] },
    });

    await selectCatalogItem(user);
    await clickWizardNext(user);
    await fillGeneralStep(user, 'web-01');
    await clickWizardNext(user);

    await expectConfigurationDefaults();
  });

  it('applies wire-format catalog field_definitions defaults through configuration and create', async () => {
    const onProvision = vi.fn().mockResolvedValue(undefined);
    const { user } = await renderWizard({
      apiFixtures: {
        catalogItems: [wireFormatCatalogItem as unknown as ComputeInstanceCatalogItem],
      },
      onProvision,
    });

    await selectCatalogItem(user);
    await clickWizardNext(user);
    await fillGeneralStep(user, 'web-01');
    await clickWizardNext(user);

    await expectWireFormatConfigurationDefaults();
    await waitForConfigurationReady(user);

    await clickWizardNext(user);
    await selectNetworkingPickers(user);
    await clickWizardNext(user);

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(onProvision).toHaveBeenCalledTimes(1);
    });

    const payload = onProvision.mock.calls[0][0];
    expect(payload.spec?.image?.sourceRef).toBe('quay.io/example/rhel9');
    expect(payload.spec?.runStrategy).toBe('Always');
    expect(payload.spec?.instanceType).toBe('standard-4-8');
    expect(payload.spec?.bootDisk).toEqual({ sizeGib: 40 });
  });

  it('prefills configuration fields when deep-linked before catalog items finish loading', async () => {
    let releaseCatalogFetch!: () => void;
    const catalogFetchGate = new Promise<void>((resolve) => {
      releaseCatalogFetch = resolve;
    });

    const catalogApiFixtures = { catalogItems: [catalogItemWithDistinctDefaults] };
    const baseFetch = createMockApiFetch(catalogApiFixtures);
    const gatedFetch: ApiFetch = async (route, options) => {
      if (route === 'v1/compute_instance_catalog_items') {
        await catalogFetchGate;
      }
      return baseFetch(route, options);
    };

    const { user } = await renderWizard({
      initialCatalogItemId: vmCatalogItem.id,
      fetch: gatedFetch,
    });

    // catalogItemId is pre-set from the URL, so Next is allowed before the catalog list loads.
    await clickWizardNext(user);
    await fillGeneralStep(user, 'web-01');
    await clickWizardNext(user);

    releaseCatalogFetch();
    await waitFor(() => {
      expect(screen.getByLabelText(/VM image/)).toBeInTheDocument();
    });

    await expectConfigurationDefaults();
  });

  it('highlights the Name field with a required error when Next is clicked without entering a name', async () => {
    const { user } = await renderWizard();

    await selectCatalogItem(user);
    await clickWizardNext(user);

    const nameInput = await screen.findByLabelText(/^Name/);
    expect(nameInput).not.toHaveAttribute('aria-invalid', 'true');

    await clickWizardNext(user);

    await expectValidationAlert();

    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput).toHaveAccessibleDescription(/Name is required/);

    const nameError = document.getElementById('metadata-name-helper-error');
    expect(nameError).toHaveTextContent('Name is required');
    expect(nameInput).toHaveAttribute('aria-describedby', 'metadata-name-helper-error');

    expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/VM image/)).not.toBeInTheDocument();
  });

  it('closes immediately on Cancel when the wizard is pristine', async () => {
    const onClosed = vi.fn();
    const { user } = await renderWizard({ onClosed });

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Cancel' }).length).toBeGreaterThan(0);
    });

    await clickWizardCancel(user);
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows discard confirmation on Cancel after selecting a catalog item', async () => {
    const onClosed = vi.fn();
    const { user } = await renderWizard({ onClosed });

    await selectCatalogItem(user);
    await clickWizardCancel(user);

    const modal = getCancelModal();
    expect(modal.getByText('Discard wizard progress?')).toBeInTheDocument();
    expect(onClosed).not.toHaveBeenCalled();
  });

  it('keeps wizard open when Stay editing is chosen on the discard modal', async () => {
    const onClosed = vi.fn();
    const { user } = await renderWizard({ onClosed });

    await selectCatalogItem(user);
    await clickWizardCancel(user);

    const modal = getCancelModal();
    await user.click(modal.getByRole('button', { name: 'Keep editing' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(onClosed).not.toHaveBeenCalled();
    expectCatalogItemSelected('RHEL 9 catalog');
  });

  it('discards and closes when Discard is confirmed', async () => {
    const onClosed = vi.fn();
    const { user } = await renderWizard({ onClosed });

    await selectCatalogItem(user);
    await clickWizardCancel(user);

    const modal = getCancelModal();
    await user.click(modal.getByRole('button', { name: 'Discard and close' }));

    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it('preserves general step values after navigating back from configuration', async () => {
    const { user } = await renderWizard();

    await advanceToConfigurationStep(user, 'persisted-vm');
    await clickWizardBack(user);

    await waitFor(() => {
      expect(screen.getByLabelText(/^Name/)).toHaveValue('persisted-vm');
    });
  });

  it('preserves configuration values after navigating back from networking', async () => {
    const { user } = await renderWizard();

    await advanceToNetworkingStep(user);
    await clickWizardBack(user);

    await waitFor(() => {
      expect(screen.getByLabelText(/VM image/)).toHaveValue('quay.io/example/rhel9');
    });
  });

  it('shows only active instance types when deprecated and active share a name', async () => {
    const { user } = await renderWizard({
      apiFixtures: {
        instanceTypes: [
          {
            id: 'standard-deprecated',
            metadata: { name: 'standard-4-8' },
            spec: { cores: 4, memory_gib: 8, state: InstanceTypeState.DEPRECATED },
          },
          {
            id: 'standard-active',
            metadata: { name: 'standard-4-8' },
            spec: { cores: 4, memory_gib: 8, state: InstanceTypeState.ACTIVE },
          },
        ],
      },
    });
    await advanceToConfigurationStep(user);

    await waitFor(() => {
      expect(screen.getByLabelText(/^Instance type/)).not.toBeDisabled();
    });

    await user.click(screen.getByLabelText(/^Instance type/));

    await waitFor(() => {
      const instanceTypeOptions = screen.getAllByRole('option');
      expect(instanceTypeOptions).toHaveLength(1);
      expect(instanceTypeOptions[0]).toHaveTextContent('standard-4-8');
    });
  });

  it('shows only ready virtual networks when pending and ready share a name', async () => {
    const { user } = await renderWizard({
      apiFixtures: {
        virtualNetworks: [
          {
            id: 'vn-pending',
            metadata: { name: 'tenant-vn' },
            status: { state: VirtualNetworkState.PENDING },
          },
          {
            id: 'vn-ready',
            metadata: { name: 'tenant-vn' },
            status: { state: VirtualNetworkState.READY },
          },
        ],
        subnets: [
          {
            id: 'subnet-1',
            metadata: { name: 'tenant-subnet' },
            spec: { virtualNetwork: 'vn-ready' },
            status: { state: SubnetState.READY },
          },
        ],
        securityGroups: [
          {
            id: 'sg-1',
            metadata: { name: 'default-sg' },
            spec: { virtualNetwork: 'vn-ready' },
            status: { state: SecurityGroupState.READY },
          },
        ],
      },
    });
    await advanceToNetworkingStep(user);

    await waitFor(() => {
      expect(screen.getByLabelText(/^Virtual network/)).toHaveTextContent('tenant-vn');
    });

    await user.click(screen.getByLabelText(/^Virtual network/));

    await waitFor(() => {
      const networkOptions = screen.getAllByRole('option');
      expect(networkOptions).toHaveLength(1);
      expect(networkOptions[0]).toHaveTextContent('tenant-vn');
    });
  });

  it('shows virtual network and subnet names on the review step', async () => {
    const { user } = await renderWizard();

    await advanceToReviewStep(user);

    await waitFor(() => {
      expect(screen.getByText('tenant-vn')).toBeInTheDocument();
      expect(screen.getByText('tenant-subnet')).toBeInTheDocument();
    });
  });

  it('shows security group names on the review step', async () => {
    const { user } = await renderWizard();

    await advanceToReviewStep(user);

    await waitFor(() => {
      expect(screen.getByText('default-sg')).toBeInTheDocument();
    });
  });

  it('shows instance type on the review step', async () => {
    const { user } = await renderWizard();

    await advanceToReviewStep(user);

    await waitFor(() => {
      expect(screen.getByText('standard-4-8 — 4 vCPU, 8 GiB')).toBeInTheDocument();
    });
  });

  it('submits create payload from review and calls onProvision', async () => {
    const onProvision = vi.fn().mockResolvedValue(undefined);
    const { user } = await renderWizard({ onProvision });

    await advanceToReviewStep(user);

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(onProvision).toHaveBeenCalledTimes(1);
    });

    const payload = onProvision.mock.calls[0][0];
    expect(payload.metadata?.name).toBe('web-01');
    expect(payload.spec?.image?.sourceRef).toBe('quay.io/example/rhel9');
    expect(payload.spec?.instanceType).toBe('standard-4-8');
    expect(payload.spec?.cores).toBeUndefined();
    expect(payload.spec?.memoryGib).toBeUndefined();
    expect(payload.spec?.networkAttachments).toEqual([
      { subnet: 'subnet-1', securityGroups: ['sg-1'] },
    ]);
  });

  it('surfaces provision errors on review without clearing form values', async () => {
    const onProvision = vi.fn().mockRejectedValue(new Error('provision failed'));
    const { user } = await renderWizard({ onProvision });

    await advanceToReviewStep(user);

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('provision failed')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });
});
