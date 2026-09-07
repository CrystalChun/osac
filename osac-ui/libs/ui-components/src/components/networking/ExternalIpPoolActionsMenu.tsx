import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Divider, Dropdown, DropdownItem, DropdownList, MenuToggle } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';

import type { ExternalIPPool } from '@osac/types/private';

import ExternalIpPoolDeleteConfirmModal from './ExternalIpPoolDeleteConfirmModal';
import { useTranslation } from '../../hooks/useTranslation';

interface ExternalIpPoolActionsMenuProps {
  pool: ExternalIPPool;
  variant?: 'kebab' | 'actions';
  onDeleted?: () => void;
}

const ExternalIpPoolActionsMenu = ({
  pool,
  variant = 'kebab',
  onDeleted,
}: ExternalIpPoolActionsMenuProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const poolName = pool.metadata?.name ?? pool.id;
  const isActionsToggle = variant === 'actions';

  return (
    <>
      {deleteOpen && (
        <ExternalIpPoolDeleteConfirmModal
          pool={pool}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => {
            setDeleteOpen(false);
            onDeleted?.();
          }}
        />
      )}
      <Dropdown
        isOpen={open}
        onOpenChange={setOpen}
        onSelect={() => setOpen(false)}
        toggle={(ref) => (
          <MenuToggle
            ref={ref}
            variant={isActionsToggle ? 'secondary' : 'plain'}
            onClick={() => setOpen((o) => !o)}
            isExpanded={open}
            aria-label={
              isActionsToggle ? t('Actions') : t('Actions for {{name}}', { name: poolName })
            }
          >
            {isActionsToggle ? t('Actions') : <EllipsisVIcon />}
          </MenuToggle>
        )}
        popperProps={{ position: 'right' }}
      >
        <DropdownList>
          {!isActionsToggle && (
            <DropdownItem
              value="view-details"
              onClick={() => navigate(`/admin/infrastructure/external-ip-pools/${pool.id}`)}
            >
              {t('View details')}
            </DropdownItem>
          )}
          <DropdownItem
            value="edit"
            onClick={() => navigate(`/admin/infrastructure/external-ip-pools/${pool.id}/edit`)}
          >
            {t('Edit')}
          </DropdownItem>
          <Divider component="li" />
          <DropdownItem
            value="delete"
            isDanger
            onClick={() => {
              setDeleteOpen(true);
              setOpen(false);
            }}
          >
            {t('Delete')}
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    </>
  );
};

export default ExternalIpPoolActionsMenu;
