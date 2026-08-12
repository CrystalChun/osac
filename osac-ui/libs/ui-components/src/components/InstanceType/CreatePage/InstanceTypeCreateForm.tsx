import { useNavigate } from 'react-router-dom';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Alert,
  Button,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { Formik } from 'formik';

import { getInstanceTypeCreateSchema } from './validation';
import { InstanceTypeCreateFormValues, instanceTypeCreateValues } from './values';
import { useCreateInstanceType } from '../../../api/v1/private/instance-type';
import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/error';
import NameField from '../../catalogProvision/wizard/fields/NameField';
import { InputField } from '../../Form/InputField';
import LeaveFormConfirmation from '../../Form/LeaveFormConfirmation';
import OsacForm from '../../Form/OsacForm';

export const INSTANCE_TYPES_LIST_ROUTE = '/admin/infrastructure/instance-types';

const InstanceTypeCreateForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync: create, error } = useCreateInstanceType();

  const navigateToList = () => navigate(INSTANCE_TYPES_LIST_ROUTE);

  const onSubmit = async (values: InstanceTypeCreateFormValues) => {
    try {
      await create({
        metadata: { name: values.metadata.name },
        spec: {
          description: values.spec.description,
          cores: Number(values.spec.cores),
          memoryGib: Number(values.spec.memoryGib),
        },
      });
      navigateToList();
    } catch {
      // tanstack handles the error
    }
  };

  return (
    <Formik
      initialValues={instanceTypeCreateValues}
      validationSchema={getInstanceTypeCreateSchema(t)}
      onSubmit={onSubmit}
    >
      {({ submitForm, isSubmitting }) => (
        <>
          <LeaveFormConfirmation />
          <Stack hasGutter>
            <StackItem>
              <OsacForm>
                <NameField />
                <InputField
                  name="spec.description"
                  label={t('Description')}
                  fieldId="instance-type-description"
                  multiline
                />
                <InputField
                  name="spec.cores"
                  label={t('CPU cores')}
                  fieldId="instance-type-cores"
                  type="number"
                  isRequired
                />
                <InputField
                  name="spec.memoryGib"
                  label={t('Memory (GiB)')}
                  fieldId="instance-type-memory-gib"
                  type="number"
                  isRequired
                />
              </OsacForm>
            </StackItem>
            {!!error && (
              <StackItem>
                <Alert variant="danger" title={t('Failed to create instance type')} isInline>
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
                    <Button variant="link" onClick={navigateToList} isDisabled={isSubmitting}>
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

export default InstanceTypeCreateForm;
