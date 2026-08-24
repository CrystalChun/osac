import { create } from '@bufbuild/protobuf';
import { Code, ConnectError } from '@connectrpc/connect';
import { screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import {
  StorageTierSchema,
  StorageTierState,
  StorageTiersListResponseSchema,
} from '@osac/types/private';

import { StorageTierSelectField } from './StorageTierSelectField';
import { renderWithProviders } from '../../test-utils/TestProviders';

const makeTier = (
  name: string,
  displayName: string,
  description: string,
  state: StorageTierState = StorageTierState.ACTIVE,
) =>
  create(StorageTierSchema, {
    id: `id-${name}`,
    metadata: { name, displayName },
    spec: { description },
    status: { state },
  });

const renderField = (options: Parameters<typeof renderWithProviders>[1], initialTier = '') =>
  renderWithProviders(
    <Formik initialValues={{ tier: initialTier, other: 'keep-me' }} onSubmit={() => undefined}>
      {({ values }) => (
        <>
          <StorageTierSelectField name="tier" label="Storage tier" fieldId="tier" />
          <output data-selected>{values.tier}</output>
          <output data-other>{values.other}</output>
        </>
      )}
    </Formik>,
    options,
  );

describe('StorageTierSelectField', () => {
  it('renders inline and sets the field to the selected tier name', async () => {
    const { user } = renderField({
      apiFixtures: {
        storageTiers: [
          makeTier('fast', 'Fast SSD', 'low latency'),
          makeTier('bulk', 'Bulk', 'cheap'),
        ],
      },
    });

    const combobox = await screen.findByRole('combobox');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(combobox);
    await user.click(await screen.findByRole('option', { name: /Bulk/ }));

    expect(screen.getByText('bulk', { selector: '[data-selected]' })).toBeInTheDocument();
  });

  it('lists only active tiers, marks the first as default, and filters as you type', async () => {
    const { user } = renderField({
      apiFixtures: {
        storageTiers: [
          makeTier('fast', 'Fast SSD', 'low latency'),
          makeTier('bulk', 'Bulk', 'cheap'),
          makeTier('gone', 'Retired', '', StorageTierState.UNSPECIFIED),
        ],
      },
    });

    const combobox = await screen.findByRole('combobox');
    await user.click(combobox);

    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(2);
    expect(screen.getByRole('option', { name: /Fast SSD \(default\)/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Retired/ })).not.toBeInTheDocument();

    await user.type(combobox, 'Bulk');
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
    expect(screen.getByRole('option', { name: /Bulk/ })).toBeInTheDocument();
  });

  it('shows an empty state directing to an administrator when no tiers are available', async () => {
    renderField({ apiFixtures: { storageTiers: [] } });

    expect(
      await screen.findByText('No storage tiers available. Contact your administrator.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('shows an error with retry that reloads tiers while preserving other form state', async () => {
    let calls = 0;
    const { user } = renderField({
      transportOverrides: {
        onStorageTierList: () => {
          calls += 1;
          if (calls === 1) {
            throw new ConnectError('boom', Code.Internal);
          }
          return create(StorageTiersListResponseSchema, {
            items: [makeTier('fast', 'Fast SSD', 'low latency')],
          });
        },
      },
    });

    const retry = await screen.findByRole('button', { name: /retry/i });
    await user.click(retry);

    expect(await screen.findByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('keep-me', { selector: '[data-other]' })).toBeInTheDocument();
  });
});
