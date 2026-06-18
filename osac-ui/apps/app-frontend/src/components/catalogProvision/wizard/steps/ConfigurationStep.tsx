import { Form, Stack, StackItem, Title } from '@patternfly/react-core';

import { SubtleContent } from '@osac/ui-components/components/SubtleContent/SubtleContent';

import {
  configurationFieldsExcludingNetwork,
  getNetworkAttachmentFieldBundle,
  hasEditableNetworkAttachmentFields,
  partitionFieldDefinitions,
  readCatalogItemFieldDefinitions,
} from '../../catalogFieldDefinition';
import type { CatalogProvisionCatalogItem } from '../../catalogProvisionItem';
import type { CatalogProvisionAdapter } from '../adapters/types';
import { CatalogFieldInput } from '../CatalogFieldInput';
import { NetworkAttachmentFields } from '../NetworkAttachmentFields';
import type { CatalogProvisionWizardState, UpdateFieldValueFn } from '../types';
import { wizardCatalogFieldErrorKey } from '../wizardBuild';

interface Props<TItem extends CatalogProvisionCatalogItem> {
  adapter: CatalogProvisionAdapter<TItem, unknown>;
  catalogItem: TItem | null;
  state: CatalogProvisionWizardState;
  updateFieldValue: UpdateFieldValueFn;
  onChangeNetworkAttachmentRows: (
    rows: CatalogProvisionWizardState['networkAttachmentRows'],
  ) => void;
  fieldErrors?: Record<string, string>;
  onClearFieldError?: (key: string) => void;
}

export const ConfigurationStep = <TItem extends CatalogProvisionCatalogItem>({
  adapter,
  catalogItem,
  state,
  updateFieldValue,
  onChangeNetworkAttachmentRows,
  fieldErrors = {},
  onClearFieldError,
}: Props<TItem>) => {
  if (!catalogItem) {
    return (
      <Stack hasGutter>
        <StackItem>
          <Title id="configuration-step-heading" headingLevel="h2" size="xl">
            Configuration
          </Title>
          <SubtleContent component="p">
            Select a catalog item to configure resource settings.
          </SubtleContent>
        </StackItem>
      </Stack>
    );
  }

  const { configuration } = partitionFieldDefinitions(
    readCatalogItemFieldDefinitions(catalogItem),
    adapter.kind,
  );
  const otherConfiguration = configurationFieldsExcludingNetwork(configuration);
  const networkBundle = getNetworkAttachmentFieldBundle(
    readCatalogItemFieldDefinitions(catalogItem),
  );
  const showNetworkAttachments = hasEditableNetworkAttachmentFields(networkBundle);

  return (
    <Stack hasGutter>
      <StackItem>
        <Title id="configuration-step-heading" headingLevel="h2" size="xl">
          Configuration
        </Title>
        <SubtleContent component="p">
          Adjust the editable settings for this catalog item.
        </SubtleContent>
      </StackItem>
      <StackItem>
        <Form className="osac-wizard-customization__section-form">
          {otherConfiguration.map((def) => {
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
          {showNetworkAttachments ? (
            <NetworkAttachmentFields
              bundle={networkBundle}
              rows={state.networkAttachmentRows}
              onChangeRows={onChangeNetworkAttachmentRows}
              fieldErrors={fieldErrors}
              onClearFieldError={onClearFieldError}
            />
          ) : null}
        </Form>
      </StackItem>
    </Stack>
  );
};
