import { describe, expect, it } from 'vitest';
import * as yup from 'yup';

import {
  applyStepValidationState,
  buildStepTouched,
  validateWizardStepFields,
  validationErrorToFormikErrors,
} from './validateStep';

describe('validateStep', () => {
  it('maps Yup nested paths to nested Formik errors for step field subset', () => {
    const schema = yup.object({
      metadata: yup.object({
        name: yup.string().trim().required('Name is required'),
      }),
      spec: yup.object({
        sshKey: yup.string().required('SSH key is required'),
      }),
    });

    const errors = validateWizardStepFields(
      schema,
      { metadata: { name: '' }, spec: { sshKey: 'present' } },
      ['metadata.name'],
    );
    expect(errors).toEqual({
      metadata: { name: 'Name is required' },
    });
  });

  it('buildStepTouched nests dotted field paths', () => {
    expect(buildStepTouched(['metadata.name', 'spec.sshKey'])).toEqual({
      metadata: { name: true },
      spec: { sshKey: true },
    });
  });

  it('validationErrorToFormikErrors nests inner paths', () => {
    const error = new yup.ValidationError('Name is required', '', 'metadata.name');
    error.inner = [error];
    expect(validationErrorToFormikErrors(error)).toEqual({
      metadata: { name: 'Name is required' },
    });
  });
});
