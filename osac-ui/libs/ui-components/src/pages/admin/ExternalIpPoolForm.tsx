import { useNavigate } from 'react-router-dom';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Alert,
  Button,
  FormSection,
  PageSection,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import MinusCircleIcon from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import PlusCircleIcon from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { FieldArray, Formik } from 'formik';
import type { TFunction } from 'i18next';
import * as Yup from 'yup';

import { ExternalIPPools, IPFamily } from '@osac/types/private';
import { useCreateResource } from '@osac/ui-components/api/use-resource';
import NameField from '@osac/ui-components/components/catalogProvision/wizard/fields/NameField';
import { InputField } from '@osac/ui-components/components/Form/InputField';
import LeaveFormConfirmation from '@osac/ui-components/components/Form/LeaveFormConfirmation';
import OsacForm from '@osac/ui-components/components/Form/OsacForm';
import {
  SelectField,
  type SelectFieldOption,
} from '@osac/ui-components/components/Form/SelectField';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import { getErrorMessage } from '@osac/ui-components/utils/error';
import { type CidrIpFamily, buildCidrSchema } from '@osac/ui-components/validation/cidr-validation';
import { resourceNameSchema } from '@osac/ui-components/validation/resource-name';

export const POOLS_LIST_PATH = '/admin/infrastructure/external-ip-pools';

interface ExternalIpPoolFormValues {
  metadata: { name: string };
  ipFamily: '' | CidrIpFamily;
  cidrs: string[];
}

const IP_FAMILY_BY_VALUE: Record<CidrIpFamily, IPFamily> = {
  ipv4: IPFamily.IP_FAMILY_IPV4,
  ipv6: IPFamily.IP_FAMILY_IPV6,
};

const cidrFieldSchema = (t: TFunction, ipFamily: CidrIpFamily) =>
  buildCidrSchema(t, ipFamily).required(t('CIDR is required'));

const getInitialValues = (): ExternalIpPoolFormValues => ({
  metadata: { name: '' },
  ipFamily: '',
  cidrs: [''],
});

const getExternalIpPoolSchema = (t: TFunction) =>
  Yup.object({
    metadata: Yup.object({ name: resourceNameSchema(t) }),
    ipFamily: Yup.string().required(t('IP family is required')),
    cidrs: Yup.array()
      .of(Yup.string().required(t('CIDR is required')))
      .when('ipFamily', {
        is: 'ipv4',
        then: (schema) => schema.of(cidrFieldSchema(t, 'ipv4')),
      })
      .when('ipFamily', {
        is: 'ipv6',
        then: (schema) => schema.of(cidrFieldSchema(t, 'ipv6')),
      })
      .min(1, t('At least one CIDR is required')),
  });

const ExternalIpPoolForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync: createPool, error } = useCreateResource(ExternalIPPools);

  const ipFamilyOptions: SelectFieldOption[] = [
    { value: 'ipv4', label: t('IPv4') },
    { value: 'ipv6', label: t('IPv6') },
  ];

  const onSubmit = async (values: ExternalIpPoolFormValues) => {
    try {
      await createPool({
        object: {
          metadata: { name: values.metadata.name },
          spec: {
            ipFamily: values.ipFamily
              ? IP_FAMILY_BY_VALUE[values.ipFamily]
              : IPFamily.IP_FAMILY_UNSPECIFIED,
            cidrs: values.cidrs,
          },
        },
      });
      navigate(POOLS_LIST_PATH);
    } catch {
      // Surfaced via the mutation's own `error` state below; nothing further to do here.
    }
  };

  return (
    <PageSection hasBodyWrapper={false}>
      <Formik
        initialValues={getInitialValues()}
        validationSchema={getExternalIpPoolSchema(t)}
        onSubmit={onSubmit}
      >
        {({ values, submitForm, isSubmitting }) => (
          <Stack hasGutter>
            <LeaveFormConfirmation />
            <StackItem>
              <OsacForm>
                <NameField isDisabled={false} />
                <SelectField
                  name="ipFamily"
                  label={t('IP family')}
                  fieldId="external-ip-pool-ip-family"
                  isRequired
                  options={ipFamilyOptions}
                />
                <FormSection title={t('CIDRs')}>
                  <FieldArray name="cidrs">
                    {(helpers) => (
                      <Stack hasGutter>
                        {values.cidrs.map((_cidr, index) => (
                          <StackItem key={index}>
                            <InputField
                              name={`cidrs.${index}`}
                              label={t('CIDR {{number}}', { number: index + 1 })}
                              fieldId={`external-ip-pool-cidr-${index}`}
                              isRequired
                            >
                              {values.cidrs.length > 1 && (
                                <Button
                                  variant="plain"
                                  aria-label={t('Remove CIDR {{number}}', {
                                    number: index + 1,
                                  })}
                                  onClick={() => helpers.remove(index)}
                                  icon={<MinusCircleIcon />}
                                />
                              )}
                            </InputField>
                          </StackItem>
                        ))}
                        <StackItem>
                          <Button
                            variant="link"
                            icon={<PlusCircleIcon />}
                            onClick={() => helpers.push('')}
                          >
                            {t('Add CIDR')}
                          </Button>
                        </StackItem>
                      </Stack>
                    )}
                  </FieldArray>
                </FormSection>
              </OsacForm>
            </StackItem>

            {!!error && (
              <StackItem>
                <Alert variant="danger" title={t('Failed to create external IP pool')} isInline>
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
                      onClick={() => navigate(POOLS_LIST_PATH)}
                      isDisabled={isSubmitting}
                    >
                      {t('Cancel')}
                    </Button>
                  </ActionListItem>
                </ActionListGroup>
              </ActionList>
            </StackItem>
          </Stack>
        )}
      </Formik>
    </PageSection>
  );
};

export default ExternalIpPoolForm;
