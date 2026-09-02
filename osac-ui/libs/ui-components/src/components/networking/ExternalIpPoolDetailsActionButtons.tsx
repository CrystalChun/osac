import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Flex } from '@patternfly/react-core';
import DumpsterIcon from '@patternfly/react-icons/dist/esm/icons/dumpster-icon';
import PencilAltIcon from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';

import type { ExternalIPPool } from '@osac/types/private';

import ExternalIpPoolDeleteConfirmModal from './ExternalIpPoolDeleteConfirmModal';
import { useTranslation } from '../../hooks/useTranslation';

const POOLS_LIST_PATH = '/admin/infrastructure/external-ip-pools';

interface ExternalIpPoolDetailsActionButtonsProps {
  pool: ExternalIPPool;
}

const ExternalIpPoolDetailsActionButtons = ({ pool }: ExternalIpPoolDetailsActionButtonsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      {deleteOpen && (
        <ExternalIpPoolDeleteConfirmModal
          pool={pool}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => navigate(POOLS_LIST_PATH)}
        />
      )}
      <Flex
        justifyContent={{ default: 'justifyContentFlexEnd' }}
        spaceItems={{ default: 'spaceItemsSm' }}
        flexWrap={{ default: 'wrap' }}
      >
        <Button
          variant="secondary"
          icon={<PencilAltIcon />}
          onClick={() => navigate(`${POOLS_LIST_PATH}/${pool.id}/edit`)}
        >
          {t('Edit')}
        </Button>
        <Button variant="danger" icon={<DumpsterIcon />} onClick={() => setDeleteOpen(true)}>
          {t('Delete')}
        </Button>
      </Flex>
    </>
  );
};

export default ExternalIpPoolDetailsActionButtons;
