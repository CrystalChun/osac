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

import { cidrSchema } from './cidr-validation';
import type { VirtualNetworkInput } from '../../api/v1/networking';
import OsacForm from '../../components/Form/OsacForm';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface VirtualNetworkCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: VirtualNetworkInput) => Promise<{ id: string }>;
  onNavigate: (id: string) => void;
}

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  ipv4Cidr: cidrSchema,
  ipv6Cidr: cidrSchema.notRequired(),
});

export const VirtualNetworkCreateModal = ({
  isOpen,
  onClose,
  onCreate,
  onNavigate,
}: VirtualNetworkCreateModalProps) => {
  const { t } = useTranslation();
  const [error, setError] = React.useState<Error | null>(null);

  return (
    <Formik
      initialValues={{ name: '', ipv4Cidr: '', ipv6Cidr: '' }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setError(null);
        try {
          const input: VirtualNetworkInput = {
            name: values.name,
            ipv4Cidr: values.ipv4Cidr,
          };
          if (values.ipv6Cidr) {
            input.ipv6Cidr = values.ipv6Cidr;
          }
          const result = await onCreate(input);
          onNavigate(result.id);
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
          aria-labelledby="vn-create-modal-title"
        >
          <ModalHeader title={t('Create virtual network')} labelId="vn-create-modal-title" />
          <ModalBody>
            <OsacForm id="vn-create-form" onSubmit={handleSubmit}>
              <Stack hasGutter>
                <StackItem>
                  <FormGroup
                    label={t('Name')}
                    isRequired
                    fieldId="vn-name"
                    helperTextInvalid={errors.name}
                    validated={touched.name && errors.name ? 'error' : 'default'}
                  >
                    <TextInput
                      id="vn-name"
                      name="name"
                      value={values.name}
                      onChange={(_, value) => handleChange({ target: { name: 'name', value } })}
                      onBlur={handleBlur}
                      validated={touched.name && errors.name ? 'error' : 'default'}
                      aria-label="Name"
                    />
                  </FormGroup>
                </StackItem>
                <StackItem>
                  <FormGroup
                    label={t('IPv4 CIDR')}
                    isRequired
                    fieldId="vn-ipv4-cidr"
                    helperText={t('Example: 10.0.0.0/16')}
                    helperTextInvalid={errors.ipv4Cidr}
                    validated={touched.ipv4Cidr && errors.ipv4Cidr ? 'error' : 'default'}
                  >
                    <TextInput
                      id="vn-ipv4-cidr"
                      name="ipv4Cidr"
                      value={values.ipv4Cidr}
                      onChange={(_, value) => handleChange({ target: { name: 'ipv4Cidr', value } })}
                      onBlur={handleBlur}
                      validated={touched.ipv4Cidr && errors.ipv4Cidr ? 'error' : 'default'}
                      aria-label="IPv4 CIDR"
                    />
                  </FormGroup>
                </StackItem>
                <StackItem>
                  <FormGroup
                    label={t('IPv6 CIDR (Optional)')}
                    fieldId="vn-ipv6-cidr"
                    helperText={t('Example: 2001:db8::/32')}
                    helperTextInvalid={errors.ipv6Cidr}
                    validated={touched.ipv6Cidr && errors.ipv6Cidr ? 'error' : 'default'}
                  >
                    <TextInput
                      id="vn-ipv6-cidr"
                      name="ipv6Cidr"
                      value={values.ipv6Cidr}
                      onChange={(_, value) => handleChange({ target: { name: 'ipv6Cidr', value } })}
                      onBlur={handleBlur}
                      validated={touched.ipv6Cidr && errors.ipv6Cidr ? 'error' : 'default'}
                      aria-label="IPv6 CIDR (Optional)"
                    />
                  </FormGroup>
                </StackItem>
                {error && (
                  <StackItem>
                    <Alert variant="danger" title={t('Failed to create virtual network')} isInline>
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
              type="submit"
              form="vn-create-form"
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
