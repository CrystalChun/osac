import { useMemo } from 'react';
import { Alert, Button, FormGroup, HelperText, HelperTextItem } from '@patternfly/react-core';
import { type TypeaheadSelectOption } from '@patternfly/react-templates';

import { TypeaheadSelectField } from './TypeaheadSelectField';
import {
  STORAGE_TIER_ACTIVE_LIST_FILTER,
  usePrivateStorageTiers,
} from '../../api/v1/private/storage-tiers';
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
  const {
    data: tiers = [],
    isLoading,
    error: loadError,
    refetch,
  } = usePrivateStorageTiers({ filter: STORAGE_TIER_ACTIVE_LIST_FILTER });

  const options = useMemo<TypeaheadSelectOption[]>(
    () =>
      tiers.map((tier, index) => {
        const displayName = tier.metadata?.displayName || tier.metadata?.name || '';
        return {
          value: tier.metadata?.name ?? '',
          content: index === 0 ? t('{{name}} (default)', { name: displayName }) : displayName,
          description: tier.spec?.description || undefined,
        };
      }),
    [tiers, t],
  );

  if (loadError) {
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

  if (!isLoading && options.length === 0) {
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
    <TypeaheadSelectField
      name={name}
      label={label}
      fieldId={fieldId}
      isRequired={isRequired}
      options={options}
      isDisabled={isLoading}
      placeholder={isLoading ? t('Loading...') : t('Select a storage tier')}
      noOptionsFoundMessage={(filter) => t('No storage tiers found for "{{filter}}"', { filter })}
    />
  );
};
