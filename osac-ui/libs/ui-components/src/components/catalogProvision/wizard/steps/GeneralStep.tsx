import { useFormikContext } from 'formik';

import { useTranslation } from '../../../../hooks/useTranslation';
import { InputField } from '../../../Form/InputField';
import OsacForm from '../../../Form/OsacForm';
import type { GeneralFieldDescriptor } from '../adapters/types';
import { CATALOG_PROVISION_MULTILINE_TEXTAREA } from '../constants';

interface Props {
  fields: GeneralFieldDescriptor[];
}

export const GeneralStep = ({ fields }: Props) => {
  const { t } = useTranslation();

  return (
    <OsacForm>
      {fields.map((field) => (
        <InputField
          key={field.name}
          name={field.name}
          label={field.label ?? t(field.labelKey)}
          fieldId={field.name.replace(/\./g, '-')}
          isRequired={field.isRequired}
          isDisabled={field.isDisabled}
          multiline={field.multiline}
          rows={field.multiline ? CATALOG_PROVISION_MULTILINE_TEXTAREA.rows : undefined}
          resizeOrientation={
            field.multiline ? CATALOG_PROVISION_MULTILINE_TEXTAREA.resizeOrientation : undefined
          }
          type={field.isPassword ? 'password' : 'text'}
          helperText={field.helperTextKey ? t(field.helperTextKey) : undefined}
        />
      ))}
    </OsacForm>
  );
};

interface CatalogFormValues {
  catalogItemId: string;
}

export const useSelectedCatalogItemId = (): string =>
  useFormikContext<CatalogFormValues>().values.catalogItemId;
