import { create } from '@bufbuild/protobuf';
import { screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { StorageTierSchema, StorageTierState } from '@osac/types';

import { createEmptyComputeInstanceValues } from './payload';
import { VmReviewStep } from './VmReviewStep';
import { renderWithProviders } from '../../../../../test-utils/TestProviders';

const makeTier = (name: string, displayName: string) =>
  create(StorageTierSchema, {
    id: `id-${name}`,
    metadata: { name, displayName },
    status: { state: StorageTierState.ACTIVE },
  });

const storageTiers = [makeTier('balanced', 'Balanced'), makeTier('fast', 'Fast SSD')];

const renderReviewStep = (
  specOverrides: Partial<ReturnType<typeof createEmptyComputeInstanceValues>['spec']>,
) => {
  const emptyValues = createEmptyComputeInstanceValues();
  return renderWithProviders(
    <Formik
      initialValues={{ ...emptyValues, spec: { ...emptyValues.spec, ...specOverrides } }}
      onSubmit={() => undefined}
    >
      <VmReviewStep catalogItem={null} />
    </Formik>,
    { apiFixtures: { publicStorageTiers: storageTiers } },
  );
};

describe('VmReviewStep — Storage section', () => {
  it('lists the boot disk and each additional disk with size and resolved tier', async () => {
    renderReviewStep({
      bootDisk: { sizeGib: '40', storageTier: 'balanced' },
      additionalDisks: [{ sizeGib: '100', storageTier: 'fast' }],
    });

    expect(await screen.findByText('Storage')).toBeInTheDocument();
    expect(screen.getByText('40 GB, Balanced')).toBeInTheDocument();
    expect(screen.getByText('100 GB, Fast SSD')).toBeInTheDocument();
  });

  it('falls back to the raw tier value when no tier matches', async () => {
    renderReviewStep({ bootDisk: { sizeGib: '40', storageTier: 'unknown-tier' } });

    expect(await screen.findByText('40 GB, unknown-tier')).toBeInTheDocument();
  });

  it('no longer lists the boot disk under the Configuration section', async () => {
    renderReviewStep({ bootDisk: { sizeGib: '40', storageTier: 'balanced' } });

    await screen.findByText('Storage');
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    // "Boot disk" label appears exactly once — inside the Storage section, not Configuration.
    expect(screen.getAllByText('Boot disk')).toHaveLength(1);
  });
});
