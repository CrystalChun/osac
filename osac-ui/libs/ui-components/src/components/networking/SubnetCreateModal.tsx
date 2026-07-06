import React from 'react';
import {
  Alert,
  Button,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  StackItem,
  TextInput,
} from '@patternfly/react-core';
import { Formik } from 'formik';
import * as Yup from 'yup';

import type { Subnet, VirtualNetwork } from '@osac/types';

import { CidrDisplay } from './CidrDisplay';
import { cidrSchema, hasSubnetOverlap, isSubnetWithinVN } from './cidr-validation';
import type { SubnetInput } from '../../api/v1/networking';
import {
  FormFieldHelper,
  getFormFieldHelperDescribedBy,
} from '../../components/Form/FormFieldHelper';
import OsacForm from '../../components/Form/OsacForm';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface SubnetCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: SubnetInput) => Promise<{ id: string }>;
  parentVN: VirtualNetwork;
  existingSubnets: Subnet[];
}

export const SubnetCreateModal = ({
  isOpen,
  onClose,
  onCreate,
  parentVN,
  existingSubnets,
}: SubnetCreateModalProps) => {
  const { t } = useTranslation();
  const [error, setError] = React.useState<Error | null>(null);

  const parentIPv4CIDR = parentVN.spec?.ipv4Cidr ?? '';
  const parentIPv6CIDR = parentVN.spec?.ipv6Cidr ?? '';
  const hasIPv4 = Boolean(parentIPv4CIDR);
  const hasIPv6 = Boolean(parentIPv6CIDR);

  const existingIPv4CIDRs = existingSubnets
    .map((s) => s.spec?.ipv4Cidr)
    .filter((cidr): cidr is string => Boolean(cidr));

  const existingIPv6CIDRs = existingSubnets
    .map((s) => s.spec?.ipv6Cidr)
    .filter((cidr): cidr is string => Boolean(cidr));

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    ipv4Cidr: hasIPv4
      ? cidrSchema
          .required('IPv4 CIDR is required')
          .test('within-vn', 'CIDR must be within parent virtual network range', (value) => {
            if (!value || !parentIPv4CIDR) {
              return true;
            }
            return isSubnetWithinVN(value, parentIPv4CIDR);
          })
          .test('no-overlap', 'CIDR overlaps with existing subnet', (value) => {
            if (!value) {
              return true;
            }
            return !hasSubnetOverlap(value, existingIPv4CIDRs);
          })
      : Yup.string(),
    ipv6Cidr: hasIPv6
      ? cidrSchema
          .required('IPv6 CIDR is required')
          .test('within-vn', 'CIDR must be within parent virtual network range', (value) => {
            if (!value || !parentIPv6CIDR) {
              return true;
            }
            return isSubnetWithinVN(value, parentIPv6CIDR);
          })
          .test('no-overlap', 'CIDR overlaps with existing subnet', (value) => {
            if (!value) {
              return true;
            }
            return !hasSubnetOverlap(value, existingIPv6CIDRs);
          })
      : Yup.string(),
  });

  return (
    <Formik
      initialValues={{ name: '', ipv4Cidr: '', ipv6Cidr: '' }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setError(null);
        try {
          const input: SubnetInput = {
            name: values.name,
            virtual_network: parentVN.id,
            ...(hasIPv4 && values.ipv4Cidr && { ipv4_cidr: values.ipv4Cidr }),
            ...(hasIPv6 && values.ipv6Cidr && { ipv6_cidr: values.ipv6Cidr }),
          };
          await onCreate(input);
          onClose();
        } catch (err: unknown) {
          setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
        <Modal
          variant="small"
          isOpen={isOpen}
          onClose={isSubmitting ? undefined : onClose}
          aria-labelledby="subnet-create-modal-title"
        >
          <ModalHeader title={t('Create subnet')} labelId="subnet-create-modal-title" />
          <ModalBody>
            <OsacForm>
              <Stack hasGutter>
                <StackItem>
                  <p>
                    {t('Parent virtual network')}: <strong>{parentVN.metadata?.name}</strong>
                  </p>
                  <CidrDisplay ipv4Cidr={parentIPv4CIDR} ipv6Cidr={parentIPv6CIDR} />
                </StackItem>
                <StackItem>
                  <FormGroup label={t('Name')} isRequired fieldId="subnet-name">
                    <TextInput
                      id="subnet-name"
                      name="name"
                      value={values.name}
                      onChange={(_, value) => handleChange({ target: { name: 'name', value } })}
                      onBlur={handleBlur}
                      validated={touched.name && errors.name ? 'error' : 'default'}
                      aria-label="Name"
                      aria-describedby={getFormFieldHelperDescribedBy(
                        'subnet-name',
                        touched.name ? errors.name : undefined,
                      )}
                    />
                    <FormFieldHelper
                      fieldId="subnet-name"
                      error={touched.name ? errors.name : undefined}
                    />
                  </FormGroup>
                </StackItem>
                {hasIPv4 && (
                  <StackItem>
                    <FormGroup label={t('IPv4 CIDR')} isRequired fieldId="subnet-ipv4-cidr">
                      <TextInput
                        id="subnet-ipv4-cidr"
                        name="ipv4Cidr"
                        value={values.ipv4Cidr}
                        onChange={(_, value) =>
                          handleChange({ target: { name: 'ipv4Cidr', value } })
                        }
                        onBlur={handleBlur}
                        validated={touched.ipv4Cidr && errors.ipv4Cidr ? 'error' : 'default'}
                        aria-label="IPv4 CIDR"
                        aria-describedby={getFormFieldHelperDescribedBy(
                          'subnet-ipv4-cidr',
                          touched.ipv4Cidr ? errors.ipv4Cidr : undefined,
                          t('Example: 10.0.1.0/24'),
                        )}
                      />
                      <FormFieldHelper
                        fieldId="subnet-ipv4-cidr"
                        error={touched.ipv4Cidr ? errors.ipv4Cidr : undefined}
                        description={t('Example: 10.0.1.0/24')}
                      />
                    </FormGroup>
                  </StackItem>
                )}
                {hasIPv6 && (
                  <StackItem>
                    <FormGroup label={t('IPv6 CIDR')} isRequired fieldId="subnet-ipv6-cidr">
                      <TextInput
                        id="subnet-ipv6-cidr"
                        name="ipv6Cidr"
                        value={values.ipv6Cidr}
                        onChange={(_, value) =>
                          handleChange({ target: { name: 'ipv6Cidr', value } })
                        }
                        onBlur={handleBlur}
                        validated={touched.ipv6Cidr && errors.ipv6Cidr ? 'error' : 'default'}
                        aria-label="IPv6 CIDR"
                        aria-describedby={getFormFieldHelperDescribedBy(
                          'subnet-ipv6-cidr',
                          touched.ipv6Cidr ? errors.ipv6Cidr : undefined,
                          t('Example: 2001:db8::/64'),
                        )}
                      />
                      <FormFieldHelper
                        fieldId="subnet-ipv6-cidr"
                        error={touched.ipv6Cidr ? errors.ipv6Cidr : undefined}
                        description={t('Example: 2001:db8::/64')}
                      />
                    </FormGroup>
                  </StackItem>
                )}
                {error && (
                  <StackItem>
                    <Alert variant="danger" title={t('Failed to create subnet')} isInline>
                      {getErrorMessage(error)}
                    </Alert>
                  </StackItem>
                )}
              </Stack>
            </OsacForm>
          </ModalBody>
          <ModalFooter>
            <Button variant="link" onClick={onClose} isDisabled={isSubmitting}>
              {t('Cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSubmit()}
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
            >
              {t('Create')}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </Formik>
  );
};
