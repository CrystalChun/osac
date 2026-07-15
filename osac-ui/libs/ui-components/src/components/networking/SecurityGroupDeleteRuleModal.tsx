import { MessageInitShape } from '@bufbuild/protobuf';
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type { SecurityGroup, SecurityGroupSchema } from '@osac/types';

import { toPlainRule } from './securityGroupRuleUtils';
import { useUpdateSecurityGroup } from '../../api/v1/networking';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface SecurityGroupDeleteRuleModalProps {
  onClose: () => void;
  securityGroup: SecurityGroup;
  direction: 'ingress' | 'egress';
  ruleIndex: number;
}

export const SecurityGroupDeleteRuleModal = ({
  onClose,
  securityGroup,
  direction,
  ruleIndex,
}: SecurityGroupDeleteRuleModalProps) => {
  const { t } = useTranslation();
  const updateSecurityGroup = useUpdateSecurityGroup();

  const handleConfirm = async () => {
    try {
      const newIngress = (securityGroup.spec?.ingress ?? []).map(toPlainRule);
      const newEgress = (securityGroup.spec?.egress ?? []).map(toPlainRule);
      const targetList = direction === 'ingress' ? newIngress : newEgress;
      targetList.splice(ruleIndex, 1);

      const object: MessageInitShape<typeof SecurityGroupSchema> = {
        id: securityGroup.id,
        metadata: { name: securityGroup.metadata?.name ?? '' },
        spec: {
          virtualNetwork: securityGroup.spec?.virtualNetwork ?? '',
          ingress: newIngress,
          egress: newEgress,
        },
      };

      await updateSecurityGroup.mutateAsync({
        object,
      });
      onClose();
    } catch {
      // Error is surfaced via updateSecurityGroup.error below
    }
  };

  return (
    <Modal variant={ModalVariant.small} isOpen onClose={onClose} aria-label={t('Delete rule')}>
      <ModalHeader title={t('Delete rule?')} titleIconVariant="warning" />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t(
              'This will permanently delete the rule. This action cannot be undone. Traffic matching this rule will be blocked.',
            )}
          </StackItem>
          {!!updateSecurityGroup.error && (
            <StackItem>
              <Alert variant="danger" title={t('Error')} isInline>
                {getErrorMessage(updateSecurityGroup.error)}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="danger"
          onClick={handleConfirm}
          isDisabled={updateSecurityGroup.isPending}
          isLoading={updateSecurityGroup.isPending}
        >
          {t('Delete')}
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={updateSecurityGroup.isPending}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
