import { useNavigate } from 'react-router-dom';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Alert,
  Button,
  FormGroup,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { Formik } from 'formik';

import { SourceType } from '@osac/types';

import { architectureLabels, guestOsFamilyLabels } from './DiskImageTable';
import { getDiskImageCreateSchema } from './validation';
import { DiskImageFormValues, diskImageCreateValues } from './values';
import { useCreateDiskImage } from '../../api/v1/disk-image';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import NameField from '../catalogProvision/wizard/fields/NameField';
import { InputField } from '../Form/InputField';
import LeaveFormConfirmation from '../Form/LeaveFormConfirmation';
import { MultiSelectField } from '../Form/MultiSelectField';
import OsacForm from '../Form/OsacForm';
import { SelectField } from '../Form/SelectField';

export const DISK_IMAGES_LIST_ROUTE = '/admin/infrastructure/disk-images';

const DiskImageForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync: create, error } = useCreateDiskImage();

  const guestOsFamilyOptions = Object.entries(guestOsFamilyLabels(t))
    .filter(([value]) => Number(value) !== 0)
    .map(([value, label]) => ({ value: Number(value), label }));

  const architectureOptions = Object.entries(architectureLabels(t))
    .filter(([value]) => Number(value) !== 0)
    .map(([value, label]) => ({ value: Number(value), label }));

  const onSubmit = async (values: DiskImageFormValues) => {
    try {
      const created = await create({
        metadata: { name: values.metadata.name },
        spec: {
          sourceType: SourceType.REGISTRY,
          sourceRef: values.spec.sourceRef,
          guestOsFamily: values.spec.guestOsFamily,
          architecture: values.spec.architecture,
        },
      });
      navigate(`${DISK_IMAGES_LIST_ROUTE}/${created.id}`);
    } catch {
      // tanstack handles the error
    }
  };

  return (
    <Formik
      initialValues={diskImageCreateValues}
      validationSchema={getDiskImageCreateSchema(t)}
      onSubmit={onSubmit}
    >
      {({ submitForm, isSubmitting }) => (
        <>
          <LeaveFormConfirmation />
          <Stack hasGutter>
            <StackItem>
              <OsacForm>
                <NameField />
                <FormGroup label={t('Source type')} fieldId="disk-image-source-type">
                  {SourceType[SourceType.REGISTRY]}
                </FormGroup>
                <InputField
                  name="spec.sourceRef"
                  label={t('Source reference')}
                  fieldId="disk-image-source-ref"
                  isRequired
                />
                <SelectField
                  name="spec.guestOsFamily"
                  label={t('Guest OS family')}
                  fieldId="disk-image-guest-os-family"
                  isRequired
                  options={guestOsFamilyOptions}
                />
                <MultiSelectField
                  name="spec.architecture"
                  label={t('Architecture')}
                  fieldId="disk-image-architecture"
                  isRequired
                  options={architectureOptions}
                />
              </OsacForm>
            </StackItem>
            {!!error && (
              <StackItem>
                <Alert variant="danger" title={t('Failed to save disk image')} isInline>
                  {getErrorMessage(error)}
                </Alert>
              </StackItem>
            )}
            <StackItem>
              <ActionList>
                <ActionListGroup>
                  <ActionListItem>
                    <Button
                      variant="primary"
                      onClick={submitForm}
                      isDisabled={isSubmitting}
                      isLoading={isSubmitting}
                    >
                      {t('Create')}
                    </Button>
                  </ActionListItem>
                  <ActionListItem>
                    <Button
                      variant="link"
                      onClick={() => navigate(DISK_IMAGES_LIST_ROUTE)}
                      isDisabled={isSubmitting}
                    >
                      {t('Cancel')}
                    </Button>
                  </ActionListItem>
                </ActionListGroup>
              </ActionList>
            </StackItem>
          </Stack>
        </>
      )}
    </Formik>
  );
};

export default DiskImageForm;
