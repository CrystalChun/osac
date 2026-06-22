import { HelperText, HelperTextItem } from '@patternfly/react-core';

interface Props {
  error?: string;
  fieldId: string;
}

export const CatalogFieldHelper = ({ error, fieldId }: Props) => {
  if (!error) {
    return null;
  }

  return (
    <HelperText>
      <HelperTextItem variant="error" id={`${fieldId}-helper-error`}>
        {error}
      </HelperTextItem>
    </HelperText>
  );
};
