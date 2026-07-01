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

import type { VirtualNetworkInput } from '../../api/v1/networking';
import OsacForm from '../../components/Form/OsacForm';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import { cidrSchema } from './cidr-validation';

interface VirtualNetworkCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: VirtualNetworkInput) => Promise<{ id: string }>;
  onNavigate: (id: string) => void;
}

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  ipv4_cidr: cidrSchema,
  ipv6_cidr: cidrSchema.notRequired(),
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
      initialValues={{ name: '', ipv4_cidr: '', ipv6_cidr: '' }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setError(null);
        try {
          const input: VirtualNetworkInput = {
            name: values.name,
            ipv4_cidr: values.ipv4_cidr,
          };
          if (values.ipv6_cidr) {
            input.ipv6_cidr = values.ipv6_cidr;
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
          <ModalHeader
            title={t('Create virtual network')}
            labelId="vn-create-modal-title"
          />
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
                    helperTextInvalid={errors.ipv4_cidr}
                    validated={touched.ipv4_cidr && errors.ipv4_cidr ? 'error' : 'default'}
                  >
                    <TextInput
                      id="vn-ipv4-cidr"
                      name="ipv4_cidr"
                      value={values.ipv4_cidr}
                      onChange={(_, value) =>
                        handleChange({ target: { name: 'ipv4_cidr', value } })
                      }
                      onBlur={handleBlur}
                      validated={touched.ipv4_cidr && errors.ipv4_cidr ? 'error' : 'default'}
                      aria-label="IPv4 CIDR"
                    />
                  </FormGroup>
                </StackItem>
                <StackItem>
                  <FormGroup
                    label={t('IPv6 CIDR (Optional)')}
                    fieldId="vn-ipv6-cidr"
                    helperText={t('Example: 2001:db8::/32')}
                    helperTextInvalid={errors.ipv6_cidr}
                    validated={touched.ipv6_cidr && errors.ipv6_cidr ? 'error' : 'default'}
                  >
                    <TextInput
                      id="vn-ipv6-cidr"
                      name="ipv6_cidr"
                      value={values.ipv6_cidr}
                      onChange={(_, value) =>
                        handleChange({ target: { name: 'ipv6_cidr', value } })
                      }
                      onBlur={handleBlur}
                      validated={touched.ipv6_cidr && errors.ipv6_cidr ? 'error' : 'default'}
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
