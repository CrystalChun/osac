import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownList, MenuToggle } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';

import type { RoleBinding } from '@osac/types';

import RoleBindingDeleteModal from './RoleBindingDeleteModal';
import { useTranslation } from '../../hooks/useTranslation';

interface RoleBindingActionsMenuProps {
  roleBinding: RoleBinding;
}

const RoleBindingActionsMenu = ({ roleBinding }: RoleBindingActionsMenuProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {deleteOpen && (
        <RoleBindingDeleteModal
          roleBinding={roleBinding}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => setDeleteOpen(false)}
        />
      )}
      <Dropdown
        isOpen={open}
        onOpenChange={setOpen}
        toggle={(ref) => (
          <MenuToggle
            ref={ref}
            variant="plain"
            onClick={() => setOpen((o) => !o)}
            aria-label={t('Actions')}
          >
            <EllipsisVIcon />
          </MenuToggle>
        )}
        popperProps={{ position: 'right' }}
      >
        <DropdownList>
          <DropdownItem onClick={() => navigate(`${roleBinding.id}/edit`)}>
            {t('Edit')}
          </DropdownItem>
          <DropdownItem
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

export default RoleBindingActionsMenu;
