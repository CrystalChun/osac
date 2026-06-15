import {
  Checkbox,
  FormGroup,
  FormSelect,
  FormSelectOption,
  TextArea,
  TextInput,
} from '@patternfly/react-core';

import type { CatalogFieldDefinition } from '../catalogFieldDefinition';
import { CatalogFieldHelper } from './CatalogFieldHelper';

interface Props {
  def: CatalogFieldDefinition;
  value: string;
  onChange: (value: string) => void;
  fieldError?: string;
  onClearFieldError?: () => void;
  id: string;
}

const isMultilineField = (def: CatalogFieldDefinition): boolean => {
  const path = def.path;
  if (path.includes('user_data') || path.includes('ssh') || path === 'pull_secret') {
    return true;
  }
  const maxLen = def.validationSchema?.maxLength;
  return def.validationSchema?.type === 'string' && typeof maxLen === 'number' && maxLen > 256;
};

const fieldValidated = (fieldError?: string) => (fieldError ? 'error' : 'default');

export const CatalogFieldInput = ({
  def,
  value,
  onChange,
  fieldError,
  onClearFieldError,
  id,
}: Props) => {
  const schema = def.validationSchema;
  const enumValues = Array.isArray(schema?.enum)
    ? schema.enum.map((entry) => String(entry))
    : undefined;
  const validated = fieldValidated(fieldError);

  const handleChange = (next: string) => {
    onChange(next);
    onClearFieldError?.();
  };

  if (enumValues?.length) {
    return (
      <FormGroup label={def.displayName} fieldId={id} isRequired={def.editable}>
        <FormSelect
          id={id}
          aria-label={def.displayName}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? `${id}-helper-error` : undefined}
          value={value}
          validated={validated}
          onChange={(_event, next) => handleChange(next)}
        >
          <FormSelectOption value="" label="Select an option" isDisabled />
          {enumValues.map((option) => (
            <FormSelectOption key={option} value={option} label={option} />
          ))}
        </FormSelect>
        <CatalogFieldHelper error={fieldError} fieldId={id} />
      </FormGroup>
    );
  }

  if (schema?.type === 'boolean') {
    return (
      <FormGroup fieldId={id}>
        <Checkbox
          id={id}
          label={def.displayName}
          isChecked={value === 'true'}
          onChange={(_event, checked) => handleChange(checked ? 'true' : 'false')}
        />
        <CatalogFieldHelper error={fieldError} fieldId={id} />
      </FormGroup>
    );
  }

  if (isMultilineField(def)) {
    return (
      <FormGroup label={def.displayName} fieldId={id}>
        <TextArea
          id={id}
          aria-label={def.displayName}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? `${id}-helper-error` : undefined}
          value={value}
          validated={validated}
          onChange={(_event, next) => handleChange(next)}
          resizeOrientation="vertical"
          rows={def.path === 'user_data' ? 8 : 4}
        />
        <CatalogFieldHelper error={fieldError} fieldId={id} />
      </FormGroup>
    );
  }

  const inputType = schema?.type === 'integer' || schema?.type === 'number' ? 'number' : 'text';

  return (
    <FormGroup label={def.displayName} fieldId={id}>
      <TextInput
        id={id}
        aria-label={def.displayName}
        aria-invalid={fieldError ? true : undefined}
        aria-describedby={fieldError ? `${id}-helper-error` : undefined}
        type={inputType}
        value={value}
        validated={validated}
        onChange={(_event, next) => handleChange(next)}
      />
      <CatalogFieldHelper error={fieldError} fieldId={id} />
    </FormGroup>
  );
};
