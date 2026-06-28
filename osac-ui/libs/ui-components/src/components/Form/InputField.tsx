import { FormGroup, TextArea, TextInput } from '@patternfly/react-core';
import { useField } from 'formik';

import { useShowFieldValidationErrors } from './FieldValidationContext';
import { FormFieldHelper, getFormFieldHelperDescribedBy } from './FormFieldHelper';
import { getVisibleFieldError } from './fieldError';

interface InputFieldProps {
  name: string;
  label: string;
  fieldId: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  multiline?: boolean;
  rows?: number;
  resizeOrientation?: 'vertical' | 'horizontal' | 'both' | 'none';
  type?: 'text' | 'number' | 'password';
  helperText?: string;
}

export const InputField = ({
  name,
  label,
  fieldId,
  isRequired = false,
  isDisabled = false,
  multiline = false,
  rows,
  resizeOrientation,
  type = 'text',
  helperText,
}: InputFieldProps) => {
  const [field, meta] = useField<string>(name);
  const showValidationErrors = useShowFieldValidationErrors();
  const error = getVisibleFieldError(meta, showValidationErrors);
  const validated = error ? 'error' : 'default';
  const helperDescribedBy = getFormFieldHelperDescribedBy(fieldId, error, helperText);

  return (
    <FormGroup label={label} fieldId={fieldId} isRequired={isRequired}>
      {multiline ? (
        <TextArea
          id={fieldId}
          name={name}
          value={field.value ?? ''}
          rows={rows}
          resizeOrientation={resizeOrientation}
          onChange={(_event, value) => {
            void field.onChange({ target: { name, value } });
          }}
          onBlur={field.onBlur}
          isDisabled={isDisabled}
          validated={validated}
          aria-invalid={error ? true : undefined}
          aria-describedby={helperDescribedBy}
        />
      ) : (
        <TextInput
          id={fieldId}
          name={name}
          type={type}
          value={field.value ?? ''}
          onChange={(_event, value) => {
            void field.onChange({ target: { name, value } });
          }}
          onBlur={field.onBlur}
          isDisabled={isDisabled}
          validated={validated}
          aria-invalid={error ? true : undefined}
          aria-describedby={helperDescribedBy}
        />
      )}
      <FormFieldHelper error={error} description={helperText} fieldId={fieldId} />
    </FormGroup>
  );
};
