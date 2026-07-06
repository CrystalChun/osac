import React from 'react';
import {
  Alert,
  Button,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  StackItem,
  TextInput,
} from '@patternfly/react-core';
import { FieldArray, Formik } from 'formik';
import * as Yup from 'yup';

import { Protocol } from '@osac/types';

import { cidrSchema } from './cidr-validation';
import type { SecurityGroupInput } from '../../api/v1/networking';
import { useVirtualNetworks } from '../../api/v1/networking';
import {
  FormFieldHelper,
  getFormFieldHelperDescribedBy,
} from '../../components/Form/FormFieldHelper';
import OsacForm from '../../components/Form/OsacForm';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface SecurityGroupCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: SecurityGroupInput) => Promise<{ id: string }>;
  onNavigate: (id: string) => void;
  virtualNetworkId?: string;
}

interface RuleFormValues {
  protocol: string;
  portFrom: string;
  portTo: string;
  ipv4Cidr: string;
  ipv6Cidr: string;
}

interface FormValues {
  name: string;
  virtual_network: string;
  ingressRules: RuleFormValues[];
  egressRules: RuleFormValues[];
}

const emptyRule: RuleFormValues = {
  protocol: String(Protocol.TCP),
  portFrom: '',
  portTo: '',
  ipv4Cidr: '',
  ipv6Cidr: '',
};

const ruleSchema = Yup.object({
  protocol: Yup.string().required('Protocol is required'),
  portFrom: Yup.number().when('protocol', {
    is: (p: string) => p === String(Protocol.TCP) || p === String(Protocol.UDP),
    then: (schema) => schema.min(1).max(65535),
    otherwise: (schema) => schema.notRequired(),
  }),
  portTo: Yup.number().when('protocol', {
    is: (p: string) => p === String(Protocol.TCP) || p === String(Protocol.UDP),
    then: (schema) => schema.min(1).max(65535),
    otherwise: (schema) => schema.notRequired(),
  }),
  ipv4Cidr: cidrSchema,
  ipv6Cidr: cidrSchema,
});

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  virtual_network: Yup.string().required('Virtual network is required'),
  ingressRules: Yup.array().of(ruleSchema),
  egressRules: Yup.array().of(ruleSchema),
});

export const SecurityGroupCreateModal = ({
  isOpen,
  onClose,
  onCreate,
  onNavigate,
  virtualNetworkId,
}: SecurityGroupCreateModalProps) => {
  const { t } = useTranslation();
  const [error, setError] = React.useState<Error | null>(null);
  const { data: virtualNetworks = [] } = useVirtualNetworks();

  return (
    <Formik<FormValues>
      initialValues={{
        name: '',
        virtual_network: virtualNetworkId ?? '',
        ingressRules: [],
        egressRules: [],
      }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setError(null);
        try {
          const input: SecurityGroupInput = {
            name: values.name,
            virtual_network: values.virtual_network,
            ingress: values.ingressRules
              .filter((r) => r.protocol)
              .map((r) => ({
                protocol: Number(r.protocol),
                ...(r.portFrom && { port_from: Number(r.portFrom) }),
                ...(r.portTo && { port_to: Number(r.portTo) }),
                ...(r.ipv4Cidr && { ipv4_cidr: r.ipv4Cidr }),
                ...(r.ipv6Cidr && { ipv6_cidr: r.ipv6Cidr }),
              })),
            egress: values.egressRules
              .filter((r) => r.protocol)
              .map((r) => ({
                protocol: Number(r.protocol),
                ...(r.portFrom && { port_from: Number(r.portFrom) }),
                ...(r.portTo && { port_to: Number(r.portTo) }),
                ...(r.ipv4Cidr && { ipv4_cidr: r.ipv4Cidr }),
                ...(r.ipv6Cidr && { ipv6_cidr: r.ipv6Cidr }),
              })),
          };
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
          variant="medium"
          isOpen={isOpen}
          onClose={isSubmitting ? undefined : onClose}
          aria-labelledby="sg-create-modal-title"
        >
          <ModalHeader title={t('Create security group')} labelId="sg-create-modal-title" />
          <ModalBody>
            <OsacForm>
              <Stack hasGutter>
                {error && (
                  <StackItem>
                    <Alert variant="danger" title={t('Error')} isInline>
                      {getErrorMessage(error)}
                    </Alert>
                  </StackItem>
                )}

                <StackItem>
                  <FormGroup label={t('Virtual Network')} isRequired fieldId="sg-vn">
                    <FormSelect
                      id="sg-vn"
                      name="virtual_network"
                      value={values.virtual_network}
                      onChange={(_, value) =>
                        handleChange({ target: { name: 'virtual_network', value } })
                      }
                      validated={
                        touched.virtual_network && errors.virtual_network ? 'error' : 'default'
                      }
                    >
                      <FormSelectOption value="" label={t('Select a virtual network')} />
                      {virtualNetworks.map((vn) => (
                        <FormSelectOption
                          key={vn.id}
                          value={vn.id}
                          label={`${vn.metadata?.name ?? vn.id} (${vn.spec?.ipv4Cidr ?? ''})`}
                        />
                      ))}
                    </FormSelect>
                    <FormFieldHelper
                      fieldId="sg-vn"
                      error={touched.virtual_network ? errors.virtual_network : undefined}
                    />
                  </FormGroup>
                </StackItem>

                <StackItem>
                  <FormGroup label={t('Name')} isRequired fieldId="sg-name">
                    <TextInput
                      id="sg-name"
                      name="name"
                      value={values.name}
                      onChange={(_, value) => handleChange({ target: { name: 'name', value } })}
                      onBlur={handleBlur}
                      validated={touched.name && errors.name ? 'error' : 'default'}
                      aria-describedby={getFormFieldHelperDescribedBy(
                        'sg-name',
                        touched.name ? errors.name : undefined,
                      )}
                    />
                    <FormFieldHelper fieldId="sg-name" error={touched.name ? errors.name : undefined} />
                  </FormGroup>
                </StackItem>
              </Stack>
            </OsacForm>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="primary"
              onClick={() => handleSubmit()}
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
            >
              {t('Create')}
            </Button>
            <Button variant="link" onClick={onClose} isDisabled={isSubmitting}>
              {t('Cancel')}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </Formik>
  );
};
