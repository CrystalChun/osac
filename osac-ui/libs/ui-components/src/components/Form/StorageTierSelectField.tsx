import { useMemo } from 'react';
import {
  Alert,
  Button,
  FormGroup,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { TypeaheadSelect, type TypeaheadSelectOption } from '@patternfly/react-templates';
import { useField } from 'formik';

import { StorageTierState } from '@osac/types/private';

import { getVisibleFieldError } from './fieldError';
import { useShowFieldValidationErrors } from './FieldValidationContext';
import { FormFieldHelper } from './FormFieldHelper';
import { usePrivateStorageTiers } from '../../api/v1/private/storage-tiers';
import { useTranslation } from '../../hooks/useTranslation';

interface StorageTierSelectFieldProps {
  name: string;
  label: string;
  fieldId: string;
  isRequired?: boolean;
}

export const StorageTierSelectField = ({
  name,
  label,
  fieldId,
  isRequired = false,
}: StorageTierSelectFieldProps) => {
  const { t } = useTranslation();
  const [field, meta, helpers] = useField<string>(name);
  const showValidationErrors = useShowFieldValidationErrors();
  const error = getVisibleFieldError(meta, showValidationErrors);

  const { data: tiers = [], isPending, isError, refetch } = usePrivateStorageTiers();

  const options = useMemo<TypeaheadSelectOption[]>(
    () =>
      tiers
        .filter((tier) => tier.status?.state === StorageTierState.ACTIVE)
        .map((tier, index) => {
          const displayName = tier.metadata?.displayName || tier.metadata?.name || '';
          return {
            value: tier.metadata?.name ?? '',
            content: index === 0 ? t('{{name}} (default)', { name: displayName }) : displayName,
            description: tier.spec?.description || undefined,
            selected: field.value === tier.metadata?.name,
          };
        }),
    [tiers, field.value, t],
  );

  if (isError) {
    return (
      <FormGroup label={label} fieldId={fieldId} isRequired={isRequired}>
        <Alert variant="danger" isInline title={t('Failed to load storage tiers')}>
          <Button variant="link" isInline onClick={() => void refetch()}>
            {t('Retry')}
          </Button>
        </Alert>
      </FormGroup>
    );
  }

  if (!isPending && options.length === 0) {
    return (
      <FormGroup label={label} fieldId={fieldId} isRequired={isRequired}>
        <HelperText>
          <HelperTextItem>
            {t('No storage tiers available. Contact your administrator.')}
          </HelperTextItem>
        </HelperText>
      </FormGroup>
    );
  }

  return (
    <FormGroup label={label} fieldId={fieldId} isRequired={isRequired}>
      <TypeaheadSelect
        id={fieldId}
        initialOptions={options}
        isDisabled={isPending}
        placeholder={isPending ? t('Loading...') : t('Select a storage tier')}
        noOptionsFoundMessage={(filter) => t('No storage tiers found for "{{filter}}"', { filter })}
        onSelect={(_event, value) => {
          void helpers.setValue(String(value), true);
          void helpers.setTouched(true);
        }}
        onClearSelection={() => {
          void helpers.setValue('', true);
        }}
        toggleProps={{
          id: fieldId,
          'aria-label': label,
          isFullWidth: true,
          status: error ? 'danger' : undefined,
        }}
      />
      <FormFieldHelper error={error} fieldId={fieldId} />
    </FormGroup>
  );
};
