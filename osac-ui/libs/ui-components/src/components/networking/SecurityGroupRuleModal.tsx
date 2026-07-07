import { useState } from 'react';
import { Formik } from 'formik';
import type { TFunction } from 'i18next';
import * as Yup from 'yup';
import {
  Alert,
  Button,
  // eslint-disable-next-line no-restricted-imports
  Form,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';

import { Protocol, type SecurityRule } from '@osac/types';

import { type RuleFormValues, SecurityGroupRuleForm } from './SecurityGroupRuleForm';
import { useTranslation } from '../../hooks/useTranslation';

const createRuleValidationSchema = (t: TFunction) =>
  Yup.object({
    protocol: Yup.number().required(t('Protocol is required')),
    portFrom: Yup.string().when('protocol', {
      is: (protocol: Protocol) => protocol === Protocol.TCP || protocol === Protocol.UDP,
      then: (schema) =>
        schema
          .required(t('Port From is required for TCP/UDP'))
          .matches(/^\d+$/, t('Port must be a number'))
          .test('range', t('Port must be between 1 and 65535'), (value) => {
            if (!value) {
              return false;
            }
            const port = parseInt(value, 10);
            return port >= 1 && port <= 65535;
          }),
      otherwise: (schema) => schema.notRequired(),
    }),
    portTo: Yup.string().when('protocol', {
      is: (protocol: Protocol) => protocol === Protocol.TCP || protocol === Protocol.UDP,
      then: (schema) =>
        schema
          .required(t('Port To is required for TCP/UDP'))
          .matches(/^\d+$/, t('Port must be a number'))
          .test('range', t('Port must be between 1 and 65535'), (value) => {
            if (!value) {
              return false;
            }
            const port = parseInt(value, 10);
            return port >= 1 && port <= 65535;
          })
          .test('min', t('Port To must be >= Port From'), function (value) {
            if (!value) {
              return false;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const portFrom = this.parent.portFrom;
            if (!portFrom) {
              return true;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return parseInt(value, 10) >= parseInt(portFrom, 10);
          }),
      otherwise: (schema) => schema.notRequired(),
    }),
    ipv4Cidr: Yup.string().when('ipv6Cidr', {
      is: (ipv6: string) => !ipv6 || ipv6.trim() === '',
      then: (schema) =>
        schema
          .required(t('At least one CIDR (IPv4 or IPv6) is required'))
          .matches(
            /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/,
            t('Invalid IPv4 CIDR format (e.g., 192.168.1.0/24)'),
          ),
      otherwise: (schema) =>
        schema.test('format', t('Invalid IPv4 CIDR format (e.g., 192.168.1.0/24)'), (value) => {
          if (!value || value.trim() === '') {
            return true;
          }
          return /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(value);
        }),
    }),
    ipv6Cidr: Yup.string().test(
      'format',
      t('Invalid IPv6 CIDR format (e.g., 2001:db8::/32)'),
      (value) => {
        if (!value || value.trim() === '') {
          return true;
        }
        return /^([0-9a-fA-F:]+)\/\d{1,3}$/.test(value);
      },
    ),
  });

interface SecurityGroupRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: SecurityRule) => Promise<void>;
  direction: 'ingress' | 'egress';
  initialValues?: SecurityRule;
  mode: 'add' | 'edit';
}

export const SecurityGroupRuleModal = ({
  isOpen,
  onClose,
  onSave,
  direction,
  initialValues,
  mode,
}: SecurityGroupRuleModalProps) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const defaultValues: RuleFormValues = {
    protocol: initialValues?.protocol ?? Protocol.TCP,
    portFrom: initialValues?.portFrom?.toString() ?? '',
    portTo: initialValues?.portTo?.toString() ?? '',
    ipv4Cidr: initialValues?.ipv4Cidr ?? '',
    ipv6Cidr: initialValues?.ipv6Cidr ?? '',
  };

  const handleSubmit = async (values: RuleFormValues) => {
    try {
      setError(null);
      // Create a plain object without protobuf metadata
      const rule = {
        protocol: values.protocol,
        ...(values.portFrom &&
          String(values.portFrom).trim() !== '' && {
            portFrom: parseInt(String(values.portFrom), 10),
          }),
        ...(values.portTo &&
          String(values.portTo).trim() !== '' && {
            portTo: parseInt(String(values.portTo), 10),
          }),
        ...(values.ipv4Cidr.trim() !== '' && { ipv4Cidr: values.ipv4Cidr }),
        ...(values.ipv6Cidr.trim() !== '' && { ipv6Cidr: values.ipv6Cidr }),
      } as SecurityRule;
      // Parent closes modal immediately and runs mutation in background
      onSave(rule);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.error('Failed to save rule:', err);
      setError(errorMessage);
    }
  };

  return (
    <Modal
      variant={ModalVariant.small}
      isOpen={isOpen}
      onClose={onClose}
      aria-label={mode === 'add' ? t('Add rule') : t('Edit rule')}
    >
      <ModalHeader title={mode === 'add' ? t('Add rule') : t('Edit rule')} />
      <Formik
        initialValues={defaultValues}
        validationSchema={createRuleValidationSchema(t)}
        onSubmit={handleSubmit}
      >
        {({ handleSubmit, isSubmitting, isValid }) => (
          <Form onSubmit={(e) => e.preventDefault()}>
            <ModalBody>
              {error && (
                <Alert
                  variant="danger"
                  title={t('Error')}
                  isInline
                  style={{ marginBottom: '1rem' }}
                >
                  {error}
                </Alert>
              )}
              <SecurityGroupRuleForm direction={direction} />
            </ModalBody>
            <ModalFooter>
              <Button
                variant="primary"
                onClick={() => handleSubmit()}
                isDisabled={isSubmitting || !isValid}
              >
                {mode === 'add' ? t('Add') : t('Save')}
              </Button>
              <Button variant="link" onClick={onClose}>
                {t('Cancel')}
              </Button>
            </ModalFooter>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};
