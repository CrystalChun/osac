import { useEffect, useMemo } from 'react';
import { FormGroup } from '@patternfly/react-core';
import { MultiTypeaheadSelect, type MultiTypeaheadSelectOption } from '@patternfly/react-templates';
import { useField } from 'formik';

import { getVisibleFieldError } from './fieldError';
import { useShowFieldValidationErrors } from './FieldValidationContext';
import { FormFieldHelper } from './FormFieldHelper';
import { type LabeledResourceRef } from './labeledResourceRef';
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
  /** When true, commits the sole option to Formik once loading finishes and exactly one option exists. */
  autoSelectSingleOption?: boolean;
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
  autoSelectSingleOption = false,
}: MultiSelectFieldProps) => {
  const [field, meta, helpers] = useField<LabeledResourceRef[]>(name);
  const showValidationErrors = useShowFieldValidationErrors();
  const error = getVisibleFieldError(meta, showValidationErrors);
  const validated = error ? 'error' : 'default';
  const effectivePlaceholder = isLoading ? loadingPlaceholder : placeholder;
  const controlDisabled = isDisabled || isLoading;

  const selectedValues = useMemo(
    () => (Array.isArray(field.value) ? field.value : []),
    [field.value],
  );

  useEffect(() => {
    if (
      !autoSelectSingleOption ||
      isLoading ||
      isDisabled ||
      options.length !== 1 ||
      selectedValues.length > 0
    ) {
      return;
    }
    void helpers.setValue([{ value: options[0].value, label: options[0].label }], false);
  }, [autoSelectSingleOption, helpers, isDisabled, isLoading, options, selectedValues.length]);

  const initialOptions = useMemo<MultiTypeaheadSelectOption[]>(() => {
    return options.map((option) => ({
      content: option.label,
      value: option.value,
      selected: selectedValues.some((value) => value.value === option.value),
      isDisabled: option.isDisabled,
    }));
  }, [options, selectedValues]);

  const toLabeledResourceRefs = (selections: (string | number)[]) =>
    selections.map((selection) => {
      const value = String(selection);
      const option = options.find((entry) => entry.value === value);
      return option ? { value: option.value, label: option.label } : { value, label: value };
    });

  return (
    <FormGroup label={label} fieldId={fieldId} isRequired={isRequired}>
      <MultiTypeaheadSelect
        id={fieldId}
        initialOptions={initialOptions}
        placeholder={effectivePlaceholder}
        isDisabled={controlDisabled}
        noOptionsFoundMessage={noOptionsFoundMessage}
        onSelectionChange={(_event, selections) => {
          void helpers.setValue(toLabeledResourceRefs(selections), true);
          void helpers.setTouched(true);
        }}
        onToggle={(open) => {
          if (!open) {
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
