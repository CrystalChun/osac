import { I18nextProvider } from 'react-i18next';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { VmUserDataField } from './VmUserDataField';
import { initTestI18n } from '../../catalogProvision/test/i18n';

const renderField = async (value?: string) => {
  const i18n = await initTestI18n();
  const view = render(
    <I18nextProvider i18n={i18n}>
      <VmUserDataField value={value} />
    </I18nextProvider>,
  );
  return { ...view, user: userEvent.setup() };
};

describe('VmUserDataField', () => {
  it('shows em dash when value is empty', async () => {
    await renderField('');
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows Provided with eye toggle for non-empty value', async () => {
    const { user } = await renderField('#cloud-config\nusers: []');
    expect(screen.getByText('Provided')).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Show user data' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(screen.getByText(/#cloud-config/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide user data' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
