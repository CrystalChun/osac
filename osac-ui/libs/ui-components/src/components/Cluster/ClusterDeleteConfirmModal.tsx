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

import type { Cluster } from '@osac/types';

import { useDeleteCluster } from '../../api/v1/cluster';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface ClusterDeleteConfirmModalProps {
  cluster: Cluster;
  onClose: () => void;
  onSuccess: () => void;
}

const ClusterDeleteConfirmModal = ({
  cluster,
  onClose,
  onSuccess,
}: ClusterDeleteConfirmModalProps) => {
  const { t } = useTranslation();
  const [isPending, setIsPending] = React.useState(false);
  const deleteCluster = useDeleteCluster();

  const clusterName = cluster.metadata?.name ?? cluster.id;

  const onDelete = async () => {
    setIsPending(true);
    deleteCluster.reset();
    try {
      await deleteCluster.mutateAsync(cluster.id);
      onSuccess();
    } catch {
      // error is handled via deleteCluster.error state
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      variant="small"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="cluster-delete-confirm-title"
    >
      <ModalHeader
        title={t('Delete {{name}}?', { name: clusterName })}
        titleIconVariant="warning"
        labelId="cluster-delete-confirm-title"
      />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t(
              'This permanently deletes the cluster and all its resources. This action cannot be undone.',
            )}
          </StackItem>
          {deleteCluster.error && (
            <StackItem>
              <Alert variant="danger" title={t('Failed to delete cluster')} isInline>
                {getErrorMessage(deleteCluster.error)}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          {t('Cancel')}
        </Button>
        <Button variant="danger" onClick={onDelete} isDisabled={isPending} isLoading={isPending}>
          {t('Delete')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ClusterDeleteConfirmModal;
