import { FormGroup, FormSelect, FormSelectOption } from '@patternfly/react-core';
import { useField } from 'formik';

import { useShowFieldValidationErrors } from './FieldValidationContext';
import { FormFieldHelper } from './FormFieldHelper';
import { getVisibleFieldError } from './fieldError';

export interface SelectFieldOption {
  value: string;
  label: string;
  isDisabled?: boolean;
}

interface SelectFieldProps {
  name: string;
  label: string;
  fieldId: string;
  options: SelectFieldOption[];
  isRequired?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  loadingPlaceholder?: string;
}

export const SelectField = ({
  name,
  label,
  fieldId,
  options,
  isRequired = false,
  isDisabled = false,
  isLoading = false,
  placeholder,
  loadingPlaceholder = 'Loading...',
}: SelectFieldProps) => {
  const [field, meta] = useField<string>(name);
  const showValidationErrors = useShowFieldValidationErrors();
  const error = getVisibleFieldError(meta, showValidationErrors);
  const validated = error ? 'error' : 'default';
  const effectivePlaceholder = isLoading ? loadingPlaceholder : placeholder;
  const controlDisabled = isDisabled || isLoading;

  return (
    <FormGroup label={label} fieldId={fieldId} isRequired={isRequired}>
      <FormSelect
        id={fieldId}
        name={name}
        value={field.value ?? ''}
        onChange={(_event, value) => {
          void field.onChange({ target: { name, value } });
        }}
        onBlur={field.onBlur}
        isDisabled={controlDisabled}
        validated={validated}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-helper-error` : undefined}
        aria-busy={isLoading || undefined}
      >
        {effectivePlaceholder ? (
          <FormSelectOption
            value=""
            label={effectivePlaceholder}
            isPlaceholder
            isDisabled
          />
        ) : null}
        {options.map((option) => (
          <FormSelectOption
            key={option.value}
            value={option.value}
            label={option.label}
            isDisabled={option.isDisabled}
          />
        ))}
      </FormSelect>
      <FormFieldHelper error={error} fieldId={fieldId} />
    </FormGroup>
  );
};
