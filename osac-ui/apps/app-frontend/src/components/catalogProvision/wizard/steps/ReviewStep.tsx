import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';

import { SubtleContent } from '@osac/ui-components/components/SubtleContent/SubtleContent';

import {
  catalogItemFieldDefinitions,
  getNetworkAttachmentFieldBundle,
  hasEditableNetworkAttachmentFields,
  isNetworkAttachmentFieldPath,
  parseSecurityGroupsRaw,
  readCatalogItemFieldDefinitions,
  resolvedFieldInputValue,
} from '../../catalogFieldDefinition';
import type { CatalogProvisionCatalogItem } from '../../catalogProvisionItem';
import type { CatalogProvisionAdapter } from '../adapters/types';
import type { CatalogProvisionWizardState } from '../types';

const formatReviewValue = (defPath: string, value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '—';
  }
  if (defPath.includes('ssh') || defPath === 'pull_secret' || defPath.includes('user_data')) {
    return 'Provided';
  }
  return trimmed;
};

interface Props<TItem extends CatalogProvisionCatalogItem> {
  adapter: CatalogProvisionAdapter<TItem, unknown>;
  catalogItem: TItem | null;
  state: CatalogProvisionWizardState;
}

export const ReviewStep = <TItem extends CatalogProvisionCatalogItem>({
  adapter,
  catalogItem,
  state,
}: Props<TItem>) => {
  const fieldDefinitions = catalogItemFieldDefinitions(catalogItem);
  const networkBundle = getNetworkAttachmentFieldBundle(
    readCatalogItemFieldDefinitions(catalogItem),
  );
  const showNetworkAttachments = hasEditableNetworkAttachmentFields(networkBundle);
  const reviewRows =
    state.networkAttachmentRows.length > 0
      ? state.networkAttachmentRows
      : [{ subnet: '', securityGroupsRaw: '' }];

  return (
    <Stack hasGutter>
      <StackItem>
        <Title id="review-heading" headingLevel="h2" size="xl">
          Review and create
        </Title>
        <SubtleContent component="p" className="osac-wizard-step__intro">
          Confirm the choices below, then {adapter.createButtonLabel.toLowerCase()}.
        </SubtleContent>
      </StackItem>
      <StackItem>
        <DescriptionList isCompact aria-labelledby="review-heading">
          <DescriptionListGroup>
            <DescriptionListTerm>Catalog item</DescriptionListTerm>
            <DescriptionListDescription>{catalogItem?.title ?? '—'}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Name</DescriptionListTerm>
            <DescriptionListDescription>
              {state.resourceName.trim() || '—'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          {fieldDefinitions.map((def) => {
            if (showNetworkAttachments && isNetworkAttachmentFieldPath(def.path)) {
              return null;
            }
            const value = resolvedFieldInputValue(def, state.fieldValues);
            return (
              <DescriptionListGroup key={def.path}>
                <DescriptionListTerm>{def.displayName}</DescriptionListTerm>
                <DescriptionListDescription>
                  {formatReviewValue(def.path, value)}
                </DescriptionListDescription>
              </DescriptionListGroup>
            );
          })}
          {showNetworkAttachments
            ? reviewRows.map((row, index) => {
                const subnetLabel = networkBundle.subnetDef?.displayName ?? 'Subnet';
                const groupsLabel =
                  networkBundle.securityGroupsDef?.displayName ?? 'Security groups';
                const groups = parseSecurityGroupsRaw(row.securityGroupsRaw);
                return (
                  <DescriptionListGroup key={`network-attachment-review-${index}`}>
                    <DescriptionListTerm>{`Network attachment ${index + 1}`}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {networkBundle.subnetDef
                        ? `${subnetLabel}: ${row.subnet.trim() || '—'}`
                        : null}
                      {networkBundle.subnetDef && networkBundle.securityGroupsDef ? ' · ' : null}
                      {networkBundle.securityGroupsDef
                        ? `${groupsLabel}: ${groups.length ? groups.join(', ') : '—'}`
                        : null}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                );
              })
            : null}
        </DescriptionList>
      </StackItem>
    </Stack>
  );
};
