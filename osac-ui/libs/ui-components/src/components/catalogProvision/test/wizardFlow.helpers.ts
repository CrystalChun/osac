import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { expect } from 'vitest';

import { clusterCatalogItem, vmCatalogItem } from './fixtures';

const catalogItemGroup = () => screen.getByRole('radiogroup', { name: 'Catalog item' });

export const expectCatalogItemVisible = async (title = vmCatalogItem.title) => {
  await waitFor(() => {
    expect(within(catalogItemGroup()).getByText(title)).toBeInTheDocument();
  });
};

export const expectCatalogItemSelected = (title = vmCatalogItem.title) => {
  const titleNode = within(catalogItemGroup()).getByText(title);
  const card = titleNode.closest('.pf-v6-c-card');
  if (!card) {
    throw new Error(`Catalog card not found for ${title}`);
  }
  expect(within(card).getByRole('radio')).toBeChecked();
};

export const selectCatalogItem = async (user: UserEvent, title = vmCatalogItem.title) => {
  await expectCatalogItemVisible(title);
  const titleNode = within(catalogItemGroup()).getByText(title);
  const card = titleNode.closest('.pf-v6-c-card');
  if (!card) {
    throw new Error(`Catalog card not found for ${title}`);
  }
  await user.click(within(card).getByRole('radio'));
};

export const clickWizardNext = async (user: UserEvent) => {
  const [nextButton] = screen.getAllByRole('button', { name: 'Next' });
  await user.click(nextButton);
};

export const clickWizardBack = async (user: UserEvent) => {
  const [backButton] = screen.getAllByRole('button', { name: 'Back' });
  await user.click(backButton);
};

export const clickWizardCancel = async (user: UserEvent) => {
  const [cancelButton] = screen.getAllByRole('button', { name: 'Cancel' });
  await user.click(cancelButton);
};

export const fillGeneralStep = async (user: UserEvent, name: string, sshKey?: string) => {
  const nameInput = screen.getByLabelText(/^Name/);
  await user.clear(nameInput);
  await user.type(nameInput, name);
  if (sshKey !== undefined) {
    const sshInput = screen.getByLabelText(/SSH public key/);
    await user.clear(sshInput);
    await user.type(sshInput, sshKey);
  }
};

export const advanceToGeneralStep = async (user: UserEvent) => {
  await selectCatalogItem(user);
  await clickWizardNext(user);
  await waitFor(() => {
    expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();
  });
};

export const advanceToConfigurationStep = async (user: UserEvent, vmName = 'web-01') => {
  await advanceToGeneralStep(user);
  await fillGeneralStep(user, vmName);
  await clickWizardNext(user);
  await waitFor(() => {
    expect(screen.getByLabelText(/VM image/)).toBeInTheDocument();
  });
};

export const fillConfigurationStep = async (
  user: UserEvent,
  imageRef = 'quay.io/example/rhel9',
) => {
  const imageInput = screen.getByLabelText(/VM image/);
  await user.clear(imageInput);
  await user.type(imageInput, imageRef);
};

export const selectSelectField = async (
  user: UserEvent,
  label: RegExp,
  optionLabel: string | RegExp,
) => {
  await user.click(screen.getByLabelText(label));
  await user.click(screen.getByRole('option', { name: optionLabel }));
};

export const waitForConfigurationReady = async (user?: UserEvent) => {
  await waitFor(() => {
    expect(screen.getByLabelText(/^Instance type/)).not.toBeDisabled();
    expect(screen.getByLabelText(/^Instance type/)).toHaveTextContent('standard-4-8');
  });

  const bootDisk = screen.queryByLabelText(/Boot disk/) as HTMLInputElement | null;
  if (bootDisk && !bootDisk.value) {
    if (!user) {
      throw new Error('Boot disk must be filled before leaving configuration');
    }
    await user.clear(bootDisk);
    await user.type(bootDisk, '40');
  }
};

export const advanceToNetworkingStep = async (user: UserEvent) => {
  await advanceToConfigurationStep(user);
  await waitForConfigurationReady(user);
  await clickWizardNext(user);
  await waitFor(() => {
    expect(screen.getByLabelText(/^Virtual network/)).toBeInTheDocument();
  });
};

export const selectNetworkingPickers = async (user: UserEvent) => {
  await waitFor(() => {
    expect(screen.getByLabelText(/^Virtual network/)).not.toBeDisabled();
    expect(screen.getByLabelText(/^Virtual network/)).toHaveTextContent('tenant-vn');
    expect(screen.getByLabelText(/^Subnet/)).toHaveTextContent('tenant-subnet');
    expect(screen.getByText('default-sg')).toBeInTheDocument();
  });

  const sgToggle = screen.getByLabelText(/^Security groups/);
  if (sgToggle.textContent === 'Select security groups') {
    await user.click(sgToggle);
    await user.click(screen.getByRole('menuitemcheckbox', { name: /default-sg/ }));
  }

  await waitFor(() => {
    expect(screen.getByLabelText(/^Security groups/)).not.toHaveTextContent(
      'Select security groups',
    );
  });
};

export const advanceToReviewStep = async (user: UserEvent) => {
  await advanceToNetworkingStep(user);
  await selectNetworkingPickers(user);
  await clickWizardNext(user);
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });
};

export const expectValidationAlert = async () => {
  await waitFor(() => {
    expect(screen.getByText('Fix the highlighted errors before continuing.')).toBeInTheDocument();
  });
};

export const getCancelModal = () => {
  const dialog = screen.getByRole('dialog');
  return within(dialog);
};

export const selectClusterCatalogItem = async (
  user: UserEvent,
  title = clusterCatalogItem.title,
) => {
  await selectCatalogItem(user, title);
};

export const fillClusterGeneralStep = async (
  user: UserEvent,
  name: string,
  pullSecret = '{"auths":{}}',
) => {
  await fillGeneralStep(user, name);
  const pullSecretInput = screen.getByLabelText(/Pull secret/);
  fireEvent.change(pullSecretInput, { target: { value: pullSecret } });
};

export const waitForClusterConfigurationReady = async () => {
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
};

export const advanceToClusterConfigurationStep = async (user: UserEvent, name = 'my-cluster') => {
  await selectClusterCatalogItem(user);
  await clickWizardNext(user);
  await fillClusterGeneralStep(user, name);
  await clickWizardNext(user);
  await waitFor(() => {
    expect(screen.getByLabelText(/Release image/)).toBeInTheDocument();
  });
  await waitForClusterConfigurationReady();
};

export const advanceToClusterReviewStep = async (user: UserEvent) => {
  await advanceToClusterConfigurationStep(user);
  await clickWizardNext(user);
  await waitFor(() => {
    expect(screen.getByLabelText(/Pod CIDR/)).toBeInTheDocument();
  });
  await clickWizardNext(user);
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });
};
