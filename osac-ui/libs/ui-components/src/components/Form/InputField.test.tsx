import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { describe, expect, it, vi } from 'vitest';

import { InputField } from './InputField';

const renderInput = (
  props: Partial<React.ComponentProps<typeof InputField>> = {},
  initialValues: Record<string, string> = { sizeGib: '30' },
) =>
  render(
    <Formik initialValues={initialValues} onSubmit={() => undefined}>
      <InputField name="sizeGib" label="Size (GiB)" fieldId="size-gib" type="number" {...props} />
    </Formik>,
  );

describe('InputField', () => {
  it('forwards min, max, and step to the number input when provided', () => {
    renderInput({ min: 1, max: 16384, step: 1 });

    const input = screen.getByRole('spinbutton', { name: 'Size (GiB)' });
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '16384');
    expect(input).toHaveAttribute('step', '1');
  });

  it('renders no min, max, or step attributes when not provided', () => {
    renderInput();

    const input = screen.getByRole('spinbutton', { name: 'Size (GiB)' });
    expect(input).not.toHaveAttribute('min');
    expect(input).not.toHaveAttribute('max');
    expect(input).not.toHaveAttribute('step');
  });

  it('trims free-text values on blur', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <Formik initialValues={{ name: '  prod-v4  ' }} onSubmit={onSubmit}>
        <InputField name="name" label="Name" fieldId="name" />
      </Formik>,
    );

    const input = screen.getByRole('textbox', { name: 'Name' });
    await user.click(input);
    await user.tab();

    expect(input).toHaveValue('prod-v4');
  });

  it('does not trim number inputs on blur', async () => {
    const user = userEvent.setup();

    render(
      <Formik initialValues={{ sizeGib: ' 30 ' }} onSubmit={() => undefined}>
        <InputField name="sizeGib" label="Size (GiB)" fieldId="size-gib" type="number" />
      </Formik>,
    );

    const input = screen.getByRole('spinbutton', { name: 'Size (GiB)' });
    await user.click(input);
    await user.tab();

    expect(input).toHaveValue(30);
  });

  it('does not trim multiline text on blur', async () => {
    const user = userEvent.setup();

    render(
      <Formik initialValues={{ notes: '  hello  ' }} onSubmit={() => undefined}>
        <InputField name="notes" label="Notes" fieldId="notes" multiline rows={3} />
      </Formik>,
    );

    const input = screen.getByRole('textbox', { name: 'Notes' });
    await user.click(input);
    await user.tab();

    expect(input).toHaveValue('  hello  ');
  });
});
