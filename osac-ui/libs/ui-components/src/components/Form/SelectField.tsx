import { useEffect, useMemo, useState, type MouseEvent, type Ref } from 'react';
import {
  FormGroup,
  MenuToggle,
  type MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
} from '@patternfly/react-core';
import { useField } from 'formik';

import { getVisibleFieldError } from './fieldError';
import { useShowFieldValidationErrors } from './FieldValidationContext';
import { FormFieldHelper } from './FormFieldHelper';

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
  /** When true, commits the sole option to Formik once loading finishes and exactly one option exists. */
  autoSelectSingleOption?: boolean;
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
  autoSelectSingleOption = false,
}: SelectFieldProps) => {
  const [field, meta, helpers] = useField<string>(name);
  const [isOpen, setIsOpen] = useState(false);
  const showValidationErrors = useShowFieldValidationErrors();
  const error = getVisibleFieldError(meta, showValidationErrors);
  const validated = error ? 'error' : 'default';
  const effectivePlaceholder = isLoading ? loadingPlaceholder : placeholder;
  const controlDisabled = isDisabled || isLoading;
  const fieldValue = field.value ?? '';

  useEffect(() => {
    if (
      !autoSelectSingleOption ||
      isLoading ||
      isDisabled ||
      options.length !== 1 ||
      fieldValue.trim()
    ) {
      return;
    }
    void helpers.setValue(options[0].value, false);
  }, [autoSelectSingleOption, fieldValue, helpers, isDisabled, isLoading, options]);

  const toggleLabel = useMemo(() => {
    if (!fieldValue.trim()) {
      return effectivePlaceholder ?? '';
    }
    return options.find((option) => option.value === fieldValue)?.label ?? fieldValue;
  }, [effectivePlaceholder, fieldValue, options]);

  const onSelect = (
    _event: MouseEvent<Element> | undefined,
    value: string | number | undefined,
  ) => {
    const nextValue = value == null ? '' : String(value);
    void helpers.setValue(nextValue, true);
    void helpers.setTouched(true, false);
    setIsOpen(false);
  };

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      id={fieldId}
      onClick={() => setIsOpen((wasOpen) => !wasOpen)}
      isExpanded={isOpen}
      isDisabled={controlDisabled}
      isFullWidth
      status={validated === 'error' ? 'danger' : undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${fieldId}-helper-error` : undefined}
      aria-busy={isLoading || undefined}
    >
      {toggleLabel}
    </MenuToggle>
  );

  return (
    <FormGroup label={label} fieldId={fieldId} isRequired={isRequired}>
      <Select
        id={`${fieldId}-select`}
        isOpen={isOpen}
        selected={fieldValue}
        onSelect={onSelect}
        onOpenChange={setIsOpen}
        toggle={toggle}
        shouldFocusToggleOnSelect
      >
        <SelectList>
          {options.map((option) => (
            <SelectOption key={option.value} value={option.value} isDisabled={option.isDisabled}>
              {option.label}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
      <FormFieldHelper error={error} fieldId={fieldId} />
    </FormGroup>
  );
};
