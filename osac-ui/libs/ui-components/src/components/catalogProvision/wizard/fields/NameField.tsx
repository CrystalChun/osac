import { useTranslation } from '../../../../hooks/useTranslation';
import { InputField } from '../../../Form/InputField';

interface NameFieldProps {
  isDisabled?: boolean;
}

const NameField = ({ isDisabled }: NameFieldProps) => {
  const { t } = useTranslation();

  return (
    <InputField
      name="metadata.name"
      label={t('Name')}
      fieldId="metadata-name"
      isRequired
      helperText={t('Name must be a valid DNS label (RFC 1035).')}
      isDisabled={isDisabled}
    />
  );
};

export default NameField;
