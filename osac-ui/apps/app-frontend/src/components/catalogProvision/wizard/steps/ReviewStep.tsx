import {
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import type { CatalogItemBase } from '@osac/api-contracts/types';
import {
  getNetworkAttachmentFieldBundle,
  hasEditableNetworkAttachmentFields,
  isNetworkAttachmentFieldPath,
  parseSecurityGroupsRaw,
  resolvedFieldInputValue,
} from '@osac/api-contracts/catalogFieldDefinition';
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

interface Props<TItem extends CatalogItemBase> {
  adapter: CatalogProvisionAdapter<TItem, unknown>;
  catalogItem: TItem | null;
  state: CatalogProvisionWizardState;
}

export const ReviewStep = <TItem extends CatalogItemBase>({
  adapter,
  catalogItem,
  state,
}: Props<TItem>) => {
  const fieldDefinitions = catalogItem?.fieldDefinitions ?? [];
  const networkBundle = getNetworkAttachmentFieldBundle(catalogItem?.fieldDefinitions);
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
        <Content component="p" className="pf-v6-u-color-text-subtle osac-wizard-step__intro">
          Confirm the choices below, then {adapter.createButtonLabel.toLowerCase()}.
        </Content>
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
