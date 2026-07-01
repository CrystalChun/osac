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

  const parentCIDR = parentVN.spec?.ipv4Cidr ?? '';
  const existingCIDRs = existingSubnets
    .map((s) => s.spec?.ipv4Cidr)
    .filter((cidr): cidr is string => Boolean(cidr));

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    ipv4Cidr: cidrSchema
      .test('within-vn', 'CIDR must be within parent virtual network range', (value) => {
        if (!value || !parentCIDR) {
          return true;
        }
        return isSubnetWithinVN(value, parentCIDR);
      })
      .test('no-overlap', 'CIDR overlaps with existing subnet', (value) => {
        if (!value) {
          return true;
        }
        return !hasSubnetOverlap(value, existingCIDRs);
      }),
  });

  return (
    <Formik
      initialValues={{ name: '', ipv4Cidr: '' }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setError(null);
        try {
          const input: SubnetInput = {
            name: values.name,
            virtual_network: parentVN.id,
            ipv4_cidr: values.ipv4Cidr,
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
                    {t('Parent virtual network')}: <strong>{parentVN.metadata?.name}</strong> (
                    {parentCIDR})
                  </p>
                </StackItem>
                {existingCIDRs.length > 0 && (
                  <StackItem>
                    <p>{t('Existing subnets')}:</p>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                      {existingSubnets.map((subnet) => (
                        <li key={subnet.id}>
                          {subnet.metadata?.name ?? subnet.id}: {subnet.spec?.ipv4Cidr}
                        </li>
                      ))}
                    </ul>
                  </StackItem>
                )}
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
                <StackItem>
                  <FormGroup label={t('CIDR')} isRequired fieldId="subnet-cidr">
                    <TextInput
                      id="subnet-cidr"
                      name="ipv4Cidr"
                      value={values.ipv4Cidr}
                      onChange={(_, value) => handleChange({ target: { name: 'ipv4Cidr', value } })}
                      onBlur={handleBlur}
                      validated={touched.ipv4Cidr && errors.ipv4Cidr ? 'error' : 'default'}
                      aria-label="CIDR"
                      aria-describedby={getFormFieldHelperDescribedBy(
                        'subnet-cidr',
                        touched.ipv4Cidr ? errors.ipv4Cidr : undefined,
                        t('Example: 10.0.1.0/24'),
                      )}
                    />
                    <FormFieldHelper
                      fieldId="subnet-cidr"
                      error={touched.ipv4Cidr ? errors.ipv4Cidr : undefined}
                      description={t('Example: 10.0.1.0/24')}
                    />
                  </FormGroup>
                </StackItem>
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
