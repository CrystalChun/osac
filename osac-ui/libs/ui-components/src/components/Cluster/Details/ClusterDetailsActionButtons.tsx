import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Flex } from '@patternfly/react-core';
import DumpsterIcon from '@patternfly/react-icons/dist/esm/icons/dumpster-icon';

import type { Cluster } from '@osac/types';

import { useTranslation } from '../../../hooks/useTranslation';
import { ClusterDeleteConfirmModal } from '../ClusterDeleteConfirmModal';

interface ClusterDetailsActionButtonsProps {
  cluster: Cluster;
}

export const ClusterDetailsActionButtons = ({ cluster }: ClusterDetailsActionButtonsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      {deleteOpen && (
        <ClusterDeleteConfirmModal
          cluster={cluster}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => navigate('/clusters')}
        />
      )}
      <Flex
        justifyContent={{ default: 'justifyContentFlexEnd' }}
        spaceItems={{ default: 'spaceItemsSm' }}
        flexWrap={{ default: 'wrap' }}
      >
        <Button variant="danger" icon={<DumpsterIcon />} onClick={() => setDeleteOpen(true)}>
          {t('Delete')}
        </Button>
      </Flex>
    </>
  );
};
