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

import type { ComputeInstance } from '@osac/types';
import { IPFamily } from '@osac/types';

import { useAttachPublicIp } from '../../../api/v1/public-ip';
import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/error';
import OsacForm from '../../Form/OsacForm';
import { RadioButtonField } from '../../Form/RadioButtonField';

interface AttachPublicIpModalProps {
  vm: ComputeInstance;
  onClose: () => void;
  onSuccess: () => void;
}

const IP_FAMILY_OPTIONS = [
  { value: 'IPv4', label: 'IPv4' },
  { value: 'IPv6', label: 'IPv6' },
];

const AttachPublicIpModal = ({ vm, onClose, onSuccess }: AttachPublicIpModalProps) => {
  const { t } = useTranslation();
  const attachPublicIp = useAttachPublicIp();

  return (
    <Formik
      initialValues={{ ipFamily: 'IPv4' }}
      onSubmit={async (values, { setSubmitting }) => {
        attachPublicIp.reset();
        try {
          await attachPublicIp.mutateAsync({
            computeInstanceId: vm.id,
            ipFamily:
              values.ipFamily === 'IPv6' ? IPFamily.IP_FAMILY_IPV6 : IPFamily.IP_FAMILY_IPV4,
          });
          onSuccess();
        } catch {
          // surfaced via attachPublicIp.error below
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
          aria-labelledby="attach-public-ip-modal-title"
        >
          <ModalHeader
            title={t('vm.details.actions.attachPublicIpModalTitle')}
            labelId="attach-public-ip-modal-title"
          />
          <ModalBody>
            <Stack hasGutter>
              <StackItem>
                <OsacForm>
                  <RadioButtonField
                    name="ipFamily"
                    label={t('vm.details.actions.ipFamily')}
                    fieldId="attach-public-ip-family"
                    options={IP_FAMILY_OPTIONS}
                    isRequired
                    isInline
                  />
                </OsacForm>
              </StackItem>
              {attachPublicIp.error && (
                <StackItem>
                  <Alert
                    variant="danger"
                    title={t('vm.details.actions.attachPublicIpError')}
                    isInline
                  >
                    {getErrorMessage(attachPublicIp.error)}
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
              {t('vm.details.actions.attach')}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </Formik>
  );
};

export default AttachPublicIpModal;
