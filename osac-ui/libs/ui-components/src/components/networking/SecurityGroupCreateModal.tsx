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
import { Formik } from 'formik';
import type { TFunction } from 'i18next';
import * as Yup from 'yup';

import type { SecurityGroup } from '@osac/types';

import { useCreateSecurityGroup, useVirtualNetworks } from '../../api/v1/networking';
import { InputField } from '../../components/Form/InputField';
import { labeledResourceRefSchema } from '../../components/Form/labeledResourceRefSchema';
import OsacForm from '../../components/Form/OsacForm';
import { SelectField } from '../../components/Form/SelectField';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface SecurityGroupCreateModalProps {
  onClose: () => void;
  /** Pre-select and lock the virtual network, e.g. when creating from a VN's detail page. */
  virtualNetworkId?: string;
}

interface FormValues {
  name: string;
  virtualNetwork: { value: string; label: string };
}

const validationSchema = (t: TFunction) =>
  Yup.object({
    name: Yup.string().required(t('Name is required')),
    virtualNetwork: labeledResourceRefSchema(t('Virtual network is required')),
  });

export const SecurityGroupCreateModal = ({
  onClose,
  virtualNetworkId,
}: SecurityGroupCreateModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createSecurityGroup = useCreateSecurityGroup();
  const { data: virtualNetworks = [], isLoading, error: vnError } = useVirtualNetworks();

  const virtualNetworkOptions = virtualNetworks.map((vn) => ({
    value: vn.id,
    label: `${vn.metadata?.name ?? vn.id} (${vn.spec?.ipv4Cidr ?? ''})`,
  }));

  const preselectedVirtualNetwork = virtualNetworkId
    ? (virtualNetworkOptions.find((option) => option.value === virtualNetworkId) ?? {
        value: virtualNetworkId,
        label: virtualNetworkId,
      })
    : { value: '', label: '' };

  return (
    <Formik<FormValues>
      enableReinitialize
      initialValues={{
        name: '',
        virtualNetwork: preselectedVirtualNetwork,
      }}
      validationSchema={validationSchema(t)}
      onSubmit={async (values) => {
        try {
          const body = {
            metadata: { name: values.name },
            spec: { virtualNetwork: values.virtualNetwork.value, ingress: [], egress: [] },
          } as unknown as SecurityGroup;
          const sg = await createSecurityGroup.mutateAsync(body);
          navigate(`/networking/security-groups/${sg.id}`);
        } catch {
          // Error is surfaced via createSecurityGroup.error below
        }
      }}
    >
      {({ submitForm, isSubmitting, isValid }) => (
        <Modal
          variant="medium"
          isOpen
          onClose={isSubmitting ? undefined : onClose}
          aria-labelledby="sg-create-modal-title"
        >
          <ModalHeader title={t('Create security group')} labelId="sg-create-modal-title" />
          <ModalBody>
            <OsacForm>
              <Stack hasGutter>
                {!!createSecurityGroup.error && (
                  <StackItem>
                    <Alert variant="danger" title={t('Error')} isInline>
                      {getErrorMessage(createSecurityGroup.error)}
                    </Alert>
                  </StackItem>
                )}

                {!!vnError && (
                  <StackItem>
                    <Alert variant="danger" title={t('Error loading virtual networks')} isInline>
                      {getErrorMessage(vnError)}
                    </Alert>
                  </StackItem>
                )}

                <StackItem>
                  <SelectField
                    name="virtualNetwork"
                    label={t('Virtual Network')}
                    fieldId="sg-vn"
                    isRequired
                    isLoading={isLoading}
                    isDisabled={Boolean(virtualNetworkId)}
                    placeholder={t('Select a virtual network')}
                    options={virtualNetworkOptions}
                  />
                </StackItem>

                <StackItem>
                  <InputField name="name" label={t('Name')} fieldId="sg-name" isRequired />
                </StackItem>
              </Stack>
            </OsacForm>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="primary"
              onClick={submitForm}
              isLoading={isSubmitting}
              isDisabled={isSubmitting || !isValid}
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
