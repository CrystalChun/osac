import { useMemo } from 'react';
import { FormGroup } from '@patternfly/react-core';
import {
  MultiTypeaheadSelect,
  type MultiTypeaheadSelectOption,
} from '@patternfly/react-templates';
import { useField } from 'formik';

import { useShowFieldValidationErrors } from './FieldValidationContext';
import { FormFieldHelper } from './FormFieldHelper';
import { getVisibleFieldError } from './fieldError';
import type { SelectFieldOption } from './SelectField';

interface MultiSelectFieldProps {
  name: string;
  label: string;
  fieldId: string;
  options: SelectFieldOption[];
  isRequired?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  loadingPlaceholder?: string;
  noOptionsFoundMessage?: string | ((filter: string) => string);
}

export const MultiSelectField = ({
  name,
  label,
  fieldId,
  options,
  isRequired = false,
  isDisabled = false,
  isLoading = false,
  placeholder = 'Select options',
  loadingPlaceholder = 'Loading...',
  noOptionsFoundMessage = (filter) => `No options found for "${filter}"`,
}: MultiSelectFieldProps) => {
  const [field, meta, helpers] = useField<string[]>(name);
  const showValidationErrors = useShowFieldValidationErrors();
  const error = getVisibleFieldError(meta, showValidationErrors);
  const validated = error ? 'error' : 'default';
  const selected = Array.isArray(field.value) ? field.value : [];
  const effectivePlaceholder = isLoading ? loadingPlaceholder : placeholder;
  const controlDisabled = isDisabled || isLoading;

  const initialOptions = useMemo<MultiTypeaheadSelectOption[]>(
    () =>
      options.map((option) => ({
        content: option.label,
        value: option.value,
        selected: selected.includes(option.value),
        isDisabled: option.isDisabled,
      })),
    [options, selected],
  );

  return (
    <FormGroup label={label} fieldId={fieldId} isRequired={isRequired}>
      <MultiTypeaheadSelect
        id={fieldId}
        initialOptions={initialOptions}
        placeholder={effectivePlaceholder}
        isDisabled={controlDisabled}
        noOptionsFoundMessage={noOptionsFoundMessage}
        onSelectionChange={(_event, selections) => {
          void helpers.setValue(selections.map(String));
          void helpers.setTouched(true);
        }}
        onToggle={(isOpen) => {
          if (!isOpen) {
            void helpers.setTouched(true);
          }
        }}
        toggleProps={{
          id: fieldId,
          'aria-label': label,
          isFullWidth: true,
          status: validated === 'error' ? 'danger' : undefined,
          'aria-busy': isLoading || undefined,
        }}
      />
      <FormFieldHelper error={error} fieldId={fieldId} />
    </FormGroup>
  );
};
