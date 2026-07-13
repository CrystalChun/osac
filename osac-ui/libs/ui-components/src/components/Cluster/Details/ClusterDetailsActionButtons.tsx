import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Flex } from '@patternfly/react-core';
import DownloadIcon from '@patternfly/react-icons/dist/esm/icons/download-icon';
import DumpsterIcon from '@patternfly/react-icons/dist/esm/icons/dumpster-icon';
import KeyIcon from '@patternfly/react-icons/dist/esm/icons/key-icon';

import { type Cluster, ClusterState } from '@osac/types';

import { useDownloadKubeconfig } from '../../../api/v1/cluster';
import { useTranslation } from '../../../hooks/useTranslation';
import ClusterDeleteConfirmModal from '../ClusterDeleteConfirmModal';
import ClusterPasswordModal from './ClusterPasswordModal';

interface ClusterDetailsActionButtonsProps {
  cluster: Cluster;
}

const ClusterDetailsActionButtons = ({ cluster }: ClusterDetailsActionButtonsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { download, isPending: isDownloading } = useDownloadKubeconfig();

  const isReady = cluster.status?.state === ClusterState.READY;
  const clusterName = cluster.metadata?.name ?? cluster.id;

  return (
    <>
      {deleteOpen && (
        <ClusterDeleteConfirmModal
          cluster={cluster}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => navigate('/clusters', { replace: true })}
        />
      )}
      {passwordOpen && (
        <ClusterPasswordModal cluster={cluster} onClose={() => setPasswordOpen(false)} />
      )}
      <Flex
        justifyContent={{ default: 'justifyContentFlexEnd' }}
        spaceItems={{ default: 'spaceItemsSm' }}
        flexWrap={{ default: 'wrap' }}
      >
        <Button
          variant="secondary"
          icon={<DownloadIcon />}
          isDisabled={!isReady || isDownloading}
          isLoading={isDownloading}
          onClick={() => void download(cluster.id, clusterName)}
        >
          {t('Download kubeconfig')}
        </Button>
        <Button
          variant="secondary"
          icon={<KeyIcon />}
          isDisabled={!isReady}
          onClick={() => setPasswordOpen(true)}
        >
          {t('View password')}
        </Button>
        <Button variant="danger" icon={<DumpsterIcon />} onClick={() => setDeleteOpen(true)}>
          {t('Delete')}
        </Button>
      </Flex>
    </>
  );
};

export default ClusterDetailsActionButtons;
