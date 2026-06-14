import { Content, Form, Stack, StackItem, Title } from '@patternfly/react-core';
import type { CatalogItemBase } from '@osac/api-contracts/types';
import {
  configurationFieldsExcludingNetwork,
  getNetworkAttachmentFieldBundle,
  hasEditableNetworkAttachmentFields,
  partitionFieldDefinitions,
} from '@osac/api-contracts/catalogFieldDefinition';
import { CatalogFieldInput } from '../CatalogFieldInput';
import { NetworkAttachmentFields } from '../NetworkAttachmentFields';
import type { CatalogProvisionAdapter } from '../adapters/types';
import { wizardCatalogFieldErrorKey } from '../wizardBuild';
import type { CatalogProvisionWizardState, UpdateFieldValueFn } from '../types';

interface Props<TItem extends CatalogItemBase> {
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

export const ConfigurationStep = <TItem extends CatalogItemBase>({
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
          <Content component="p" className="pf-v6-u-color-text-subtle osac-wizard-step__intro">
            Select a catalog item to configure resource settings.
          </Content>
        </StackItem>
      </Stack>
    );
  }

  const { configuration } = partitionFieldDefinitions(catalogItem.fieldDefinitions, adapter.kind);
  const otherConfiguration = configurationFieldsExcludingNetwork(configuration);
  const networkBundle = getNetworkAttachmentFieldBundle(catalogItem.fieldDefinitions);
  const showNetworkAttachments = hasEditableNetworkAttachmentFields(networkBundle);

  return (
    <Stack hasGutter>
      <StackItem>
        <Title id="configuration-step-heading" headingLevel="h2" size="xl">
          Configuration
        </Title>
        <Content component="p" className="pf-v6-u-color-text-subtle osac-wizard-step__intro">
          Adjust the editable settings for this catalog item.
        </Content>
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
