import { useTranslation } from '../../../../hooks/useTranslation';
import { InputField } from '../../../Form/InputField';

const NameField = () => {
  const { t } = useTranslation();

  return (
    <InputField
      name="metadata.name"
      label={t('Name')}
      fieldId="metadata-name"
      isRequired
      helperText={t('Name must be a valid DNS label (RFC 1035).')}
    />
  );
};

export default NameField;
