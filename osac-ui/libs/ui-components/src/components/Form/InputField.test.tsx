import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { InputField } from './InputField';

const renderInput = (props: Partial<React.ComponentProps<typeof InputField>> = {}) =>
  render(
    <Formik initialValues={{ sizeGib: '30' }} onSubmit={() => undefined}>
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
});
