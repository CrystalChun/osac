import { Button, Flex, FlexItem, FormGroup, Stack, StackItem, Title } from '@patternfly/react-core';
import MinusCircleIcon from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import PlusCircleIcon from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';

import type {
  NetworkAttachmentFieldBundle,
  NetworkAttachmentRowInput,
} from '../catalogFieldDefinition';
import { CatalogFieldInput } from './CatalogFieldInput';
import { wizardNetworkAttachmentErrorKey } from './wizardBuild';

interface Props {
  bundle: NetworkAttachmentFieldBundle;
  rows: NetworkAttachmentRowInput[];
  onChangeRows: (rows: NetworkAttachmentRowInput[]) => void;
  fieldErrors?: Record<string, string>;
  onClearFieldError?: (key: string) => void;
}

export const NetworkAttachmentFields = ({
  bundle,
  rows,
  onChangeRows,
  fieldErrors = {},
  onClearFieldError,
}: Props) => {
  const displayRows = rows.length > 0 ? rows : [{ subnet: '', securityGroupsRaw: '' }];

  const updateRow = (index: number, patch: Partial<NetworkAttachmentRowInput>) => {
    const next = displayRows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChangeRows(next);
  };

  const addRow = () => {
    onChangeRows([...displayRows, { subnet: '', securityGroupsRaw: '' }]);
  };

  const removeRow = (index: number) => {
    if (displayRows.length <= 1) {
      return;
    }
    onChangeRows(displayRows.filter((_, i) => i !== index));
  };

  return (
    <Stack hasGutter className="osac-wizard-network-attachments">
      <StackItem>
        <Title headingLevel="h3" size="md" className="osac-wizard-customization__section-title">
          Network attachments
        </Title>
      </StackItem>
      {displayRows.map((row, index) => (
        <StackItem key={`network-attachment-row-${index}`}>
          <Flex
            alignItems={{ default: 'alignItemsFlexEnd' }}
            flexWrap={{ default: 'wrap' }}
            gap={{ default: 'gapMd' }}
            className="osac-wizard-network-attachments__row"
          >
            {bundle.subnetDef ? (
              <FlexItem
                flex={{ default: 'flex_1' }}
                className="osac-wizard-network-attachments__subnet"
              >
                <CatalogFieldInput
                  id={`network-attachment-${index}-subnet`}
                  def={bundle.subnetDef}
                  value={row.subnet}
                  onChange={(value) => updateRow(index, { subnet: value })}
                  fieldError={fieldErrors[wizardNetworkAttachmentErrorKey(index, 'subnet')]}
                  onClearFieldError={() =>
                    onClearFieldError?.(wizardNetworkAttachmentErrorKey(index, 'subnet'))
                  }
                />
              </FlexItem>
            ) : null}
            {bundle.securityGroupsDef ? (
              <FlexItem
                flex={{ default: 'flex_1' }}
                className="osac-wizard-network-attachments__security-groups"
              >
                <CatalogFieldInput
                  id={`network-attachment-${index}-security-groups`}
                  def={{
                    ...bundle.securityGroupsDef,
                    displayName: bundle.securityGroupsDef.displayName,
                  }}
                  value={row.securityGroupsRaw}
                  onChange={(value) => updateRow(index, { securityGroupsRaw: value })}
                  fieldError={
                    fieldErrors[wizardNetworkAttachmentErrorKey(index, 'security_groups')]
                  }
                  onClearFieldError={() =>
                    onClearFieldError?.(wizardNetworkAttachmentErrorKey(index, 'security_groups'))
                  }
                />
              </FlexItem>
            ) : null}
            {displayRows.length > 1 ? (
              <FlexItem>
                <FormGroup fieldId={`network-attachment-${index}-remove`}>
                  <Button
                    id={`network-attachment-${index}-remove`}
                    variant="link"
                    icon={<MinusCircleIcon />}
                    onClick={() => removeRow(index)}
                    aria-label={`Remove network attachment ${index + 1}`}
                  >
                    Remove
                  </Button>
                </FormGroup>
              </FlexItem>
            ) : null}
          </Flex>
        </StackItem>
      ))}
      <StackItem>
        <Button variant="link" icon={<PlusCircleIcon />} onClick={addRow}>
          Add subnet
        </Button>
      </StackItem>
    </Stack>
  );
};
