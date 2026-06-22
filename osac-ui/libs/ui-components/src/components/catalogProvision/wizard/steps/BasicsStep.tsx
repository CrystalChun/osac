import { FormGroup, Stack, StackItem, TextInput, Title } from '@patternfly/react-core';

import OsacForm from '../../../Form/OsacForm';
import { SubtleContent } from '../../../SubtleContent/SubtleContent';
import {
  partitionFieldDefinitions,
  readCatalogItemFieldDefinitions,
} from '../../catalogFieldDefinition';
import type { CatalogProvisionCatalogItem } from '../../catalogProvisionItem';
import type { CatalogProvisionAdapter } from '../adapters/types';
import { CatalogFieldHelper } from '../CatalogFieldHelper';
import { CatalogFieldInput } from '../CatalogFieldInput';
import type { CatalogProvisionWizardState, UpdateDraftFn, UpdateFieldValueFn } from '../types';
import { wizardCatalogFieldErrorKey } from '../wizardBuild';

interface Props<TItem extends CatalogProvisionCatalogItem> {
  adapter: CatalogProvisionAdapter<TItem, unknown>;
  catalogItem: TItem | null;
  state: CatalogProvisionWizardState;
  update: UpdateDraftFn;
  updateFieldValue: UpdateFieldValueFn;
  fieldErrors?: Record<string, string>;
  onClearFieldError?: (key: string) => void;
}

export const BasicsStep = <TItem extends CatalogProvisionCatalogItem>({
  adapter,
  catalogItem,
  state,
  update,
  updateFieldValue,
  fieldErrors = {},
  onClearFieldError,
}: Props<TItem>) => {
  const { basics } = partitionFieldDefinitions(
    readCatalogItemFieldDefinitions(catalogItem),
    adapter.kind,
  );
  const nameError = fieldErrors.resourceName;
  const nameValidated = nameError ? 'error' : 'default';

  return (
    <Stack hasGutter>
      <StackItem>
        <Title id="basics-step-heading" headingLevel="h2" size="xl">
          Basics
        </Title>
        <SubtleContent component="p">
          Name your resource and provide access credentials defined by this catalog item.
        </SubtleContent>
      </StackItem>
      <StackItem>
        <OsacForm>
          <FormGroup label={adapter.resourceNameLabel} fieldId="resource-name" isRequired>
            <TextInput
              id="resource-name"
              aria-label={adapter.resourceNameLabel}
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? 'resource-name-helper-error' : undefined}
              value={state.resourceName}
              validated={nameValidated}
              onChange={(_event, value) => {
                update('resourceName', value);
                onClearFieldError?.('resourceName');
              }}
            />
            <CatalogFieldHelper error={nameError} fieldId="resource-name" />
          </FormGroup>
          {basics.map((def) => {
            const fieldId = `catalog-field-${def.path.replace(/\./g, '-')}`;
            return (
              <CatalogFieldInput
                key={def.path}
                id={fieldId}
                def={def}
                value={state.fieldValues[def.path] ?? ''}
                onChange={(value) => updateFieldValue(def.path, value)}
                fieldError={fieldErrors[wizardCatalogFieldErrorKey(def.path)]}
                onClearFieldError={() => onClearFieldError?.(wizardCatalogFieldErrorKey(def.path))}
              />
            );
          })}
        </OsacForm>
      </StackItem>
    </Stack>
  );
};
