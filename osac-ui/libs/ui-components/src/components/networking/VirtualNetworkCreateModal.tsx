import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Formik, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { useCreateVirtualNetwork, useNetworkClasses } from '../../api/v1/networking';
import { InputField } from '../../components/Form/InputField';
import OsacForm from '../../components/Form/OsacForm';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import { buildCidrSchema } from '../../validation/cidr-validation';
import { SelectField } from '../Form/SelectField';

type VirtualNetworkCreateFormValues = {
  name: string;
  networkClass: string;
  ipv4Cidr: string;
  ipv6Cidr: string;
};

const VirtualNetworkCreateForm = () => {
  const { values, setFieldValue } = useFormikContext<VirtualNetworkCreateFormValues>();
  const { t } = useTranslation();

  const { data: networkClasses = [], isLoading: isLoadingNetworkClasses } = useNetworkClasses();

  const defaultNcName = networkClasses.find((nc) => nc.isDefault)?.metadata?.name;

  React.useEffect(() => {
    if (defaultNcName && values.networkClass === '') {
      setFieldValue('networkClass', defaultNcName);
    }
  }, [defaultNcName, setFieldValue, values.networkClass]);

  return (
    <OsacForm>
      <InputField name="name" label={t('Name')} fieldId="vn-name" isRequired />
      <SelectField
        fieldId="networkClass"
        name="networkClass"
        label={t('Network class')}
        options={networkClasses.map((nc) => ({
          label: nc.title || nc.metadata?.name || nc.id,
          value: nc.metadata?.name || '',
        }))}
        isRequired
        isLoading={isLoadingNetworkClasses}
      />
      <InputField
        name="ipv4Cidr"
        label={t('IPv4 CIDR')}
        fieldId="vn-ipv4-cidr"
        helperText={t('Example: 10.0.0.0/16')}
      />
      <InputField
        name="ipv6Cidr"
        label={t('IPv6 CIDR (Optional)')}
        fieldId="vn-ipv6-cidr"
        helperText={t('Example: 2001:db8::/32')}
      />
    </OsacForm>
  );
};

interface VirtualNetworkCreateModalProps {
  onClose: () => void;
}

export const VirtualNetworkCreateModal = ({ onClose }: VirtualNetworkCreateModalProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutateAsync: create, error } = useCreateVirtualNetwork();

  const validationSchema = useMemo(
    () =>
      Yup.object({
        name: Yup.string().required(t('Name is required')),
        networkClass: Yup.string().required(t('Network class is required')),
        ipv4Cidr: buildCidrSchema(t, 'ipv4'),
        ipv6Cidr: buildCidrSchema(t, 'ipv6'),
      }).test('at-least-one-cidr', t('At least one CIDR (IPv4 or IPv6) is required'), (values) =>
        Boolean(values.ipv4Cidr || values.ipv6Cidr),
      ),
    [t],
  );

  return (
    <Formik<VirtualNetworkCreateFormValues>
      initialValues={{ name: '', networkClass: '', ipv4Cidr: '', ipv6Cidr: '' }}
      validationSchema={validationSchema}
      onSubmit={async (values) => {
        try {
          const result = await create({
            metadata: {
              name: values.name,
            },
            spec: {
              networkClass: {
                name: values.networkClass,
              },
              ipv4Cidr: values.ipv4Cidr || undefined,
              ipv6Cidr: values.ipv6Cidr || undefined,
              capabilities: {
                enableDualStack: !!values.ipv4Cidr && !!values.ipv6Cidr,
                enableIpv4: !!values.ipv4Cidr,
                enableIpv6: !!values.ipv6Cidr,
              },
            },
          });
          navigate(`/networking/virtual-networks/${result.id}`);
        } catch {
          // tanstack handles the error
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
            <Stack hasGutter>
              <StackItem>
                <VirtualNetworkCreateForm />
              </StackItem>
              {!!error && (
                <StackItem>
                  <Alert variant="danger" title={t('Failed to create virtual network')} isInline>
                    {getErrorMessage(error)}
                  </Alert>
                </StackItem>
              )}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="link" onClick={onClose} isDisabled={isSubmitting}>
              {t('Cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={submitForm}
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
