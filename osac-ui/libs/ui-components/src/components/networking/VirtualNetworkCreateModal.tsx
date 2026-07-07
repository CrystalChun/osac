import React from 'react';
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { cidrSchema } from './cidr-validation';
import type { VirtualNetworkInput } from '../../api/v1/networking';
import { useNetworkClasses } from '../../api/v1/networking';
import { InputField } from '../../components/Form/InputField';
import OsacForm from '../../components/Form/OsacForm';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface VirtualNetworkCreateModalProps {
  onClose: () => void;
  onCreate: (input: VirtualNetworkInput) => Promise<{ id: string }>;
  onNavigate: (id: string) => void;
}

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  ipv4Cidr: cidrSchema,
  ipv6Cidr: cidrSchema,
}).test('at-least-one-cidr', 'At least one CIDR (IPv4 or IPv6) is required', (values) => {
  return Boolean(values.ipv4Cidr || values.ipv6Cidr);
});

export const VirtualNetworkCreateModal = ({
  onClose,
  onCreate,
  onNavigate,
}: VirtualNetworkCreateModalProps) => {
  const { t } = useTranslation();
  const [error, setError] = React.useState<Error | null>(null);
  const { data: networkClasses = [], isLoading: isLoadingNetworkClasses } = useNetworkClasses();

  const defaultNetworkClass =
    networkClasses.find((nc) => nc.title === 'CUDN Network Implementation')?.id ??
    networkClasses[0]?.id ??
    '';

  return (
    <Formik
      initialValues={{ name: '', ipv4Cidr: '', ipv6Cidr: '' }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setError(null);
        try {
          if (!defaultNetworkClass) {
            throw new Error('No network classes available');
          }
          const input: VirtualNetworkInput = {
            name: values.name,
            network_class: defaultNetworkClass,
          };
          if (values.ipv4Cidr) {
            input.ipv4_cidr = values.ipv4Cidr;
          }
          if (values.ipv6Cidr) {
            input.ipv6_cidr = values.ipv6Cidr;
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
      {({ submitForm, isSubmitting }) => (
        <Modal
          variant="small"
          isOpen
          onClose={isSubmitting ? undefined : onClose}
          aria-labelledby="vn-create-modal-title"
        >
          <ModalHeader title={t('Create virtual network')} labelId="vn-create-modal-title" />
          <ModalBody>
            <OsacForm>
              <Stack hasGutter>
                <StackItem>
                  <InputField name="name" label={t('Name')} fieldId="vn-name" isRequired />
                </StackItem>
                <StackItem>
                  <InputField
                    name="ipv4Cidr"
                    label={t('IPv4 CIDR')}
                    fieldId="vn-ipv4-cidr"
                    helperText={t('Example: 10.0.0.0/16')}
                  />
                </StackItem>
                <StackItem>
                  <InputField
                    name="ipv6Cidr"
                    label={t('IPv6 CIDR (Optional)')}
                    fieldId="vn-ipv6-cidr"
                    helperText={t('Example: 2001:db8::/32')}
                  />
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
              onClick={submitForm}
              isDisabled={isSubmitting || isLoadingNetworkClasses || !defaultNetworkClass}
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
