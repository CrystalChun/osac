import { useEffect, useRef } from 'react';
import {
  Alert,
  Button,
  ClipboardCopy,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type { Cluster } from '@osac/types';

import { useFetchClusterPassword } from '../../../api/v1/cluster';
import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/error';

const AUTO_CLOSE_SECONDS = 60;

interface ClusterPasswordModalProps {
  cluster: Cluster;
  onClose: () => void;
}

const ClusterPasswordModal = ({ cluster, onClose }: ClusterPasswordModalProps) => {
  const { t } = useTranslation();
  const { fetchPassword, isPending, error, password, reset } = useFetchClusterPassword();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void fetchPassword(cluster.id);
    return () => {
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cluster.id]);

  useEffect(() => {
    if (password) {
      timerRef.current = setTimeout(onClose, AUTO_CLOSE_SECONDS * 1000);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [password, onClose]);

  return (
    <Modal variant="small" isOpen onClose={onClose} aria-labelledby="cluster-password-title">
      <ModalHeader title={t('Cluster password')} labelId="cluster-password-title" />
      <ModalBody>
        <Stack hasGutter>
          {isPending && (
            <StackItem>
              <Spinner size="lg" aria-label={t('Loading cluster password')} />
            </StackItem>
          )}
          {error && (
            <StackItem>
              <Alert variant="danger" title={t('Failed to load cluster password')} isInline>
                {getErrorMessage(error)}
              </Alert>
            </StackItem>
          )}
          {password && (
            <StackItem>
              <ClipboardCopy isReadOnly hoverTip={t('Copy')} clickTip={t('Copied')}>
                {password}
              </ClipboardCopy>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose}>
          {t('Close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ClusterPasswordModal;
