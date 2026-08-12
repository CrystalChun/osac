import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import InstanceTypeCreateForm from './InstanceTypeCreateForm';
import { renderWithProviders } from '../../../test-utils/TestProviders';

// A separate file from InstanceTypeCreateForm.test.tsx because that file mocks
// useNavigate, which bypasses the real router transitions LeaveFormConfirmation's
// useBlocker needs to intercept.

const CREATE_ROUTE = '/admin/infrastructure/instance-types/create';
const LIST_ROUTE = '/admin/infrastructure/instance-types';

const renderForm = () =>
  renderWithProviders(
    <Routes>
      <Route path={CREATE_ROUTE} element={<InstanceTypeCreateForm />} />
      <Route path={LIST_ROUTE} element={<div>Instance types list</div>} />
    </Routes>,
    { routerEntries: [CREATE_ROUTE] },
  );

describe('InstanceTypeCreateForm leave confirmation', () => {
  it('does not block navigation via Cancel when the form is untouched', async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByText('Instance types list')).toBeInTheDocument();
  });

  it('blocks navigation via Cancel when the form is dirty, until confirmed', async () => {
    const { user } = renderForm();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'gp-small');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      await screen.findByRole('heading', { name: /Discard unsaved changes\?/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Discard and close' }));

    expect(await screen.findByText('Instance types list')).toBeInTheDocument();
  });

  it('keeps editing without losing entered data when Keep editing is clicked', async () => {
    const { user } = renderForm();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'gp-small');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Keep editing' }));

    expect(
      screen.queryByRole('heading', { name: /Discard unsaved changes\?/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('gp-small');
  });
});
