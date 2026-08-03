import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownList, MenuToggle } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';

import { IdentityProvider } from '@osac/types';

import IdentityProviderDeleteModal from './IdentityProviderDeleteModal';
import IdentityProviderEnableModal from './IdentityProviderEnableModal';
import { getIdpName } from './utils';
import { useTranslation } from '../../hooks/useTranslation';

interface IdentityProviderActionsMenuProps {
  idp: IdentityProvider;
}

const IdentityProviderActionsMenu = ({ idp }: IdentityProviderActionsMenuProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [enableOpen, setEnableOpen] = useState(false);

  return (
    <>
      {deleteOpen && (
        <IdentityProviderDeleteModal
          idp={idp}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => setDeleteOpen(false)}
        />
      )}
      {enableOpen && (
        <IdentityProviderEnableModal
          idp={idp}
          onClose={() => setEnableOpen(false)}
          onSuccess={() => setEnableOpen(false)}
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
            aria-label={t('Actions for {{name}}', { name: getIdpName(idp) })}
          >
            <EllipsisVIcon />
          </MenuToggle>
        )}
        popperProps={{ position: 'right' }}
      >
        <DropdownList>
          <DropdownItem onClick={() => navigate(`/tenant/identity-provider/${idp.id}/edit`)}>
            {t('Edit')}
          </DropdownItem>
          <DropdownItem
            onClick={() => {
              setEnableOpen(true);
              setOpen(false);
            }}
          >
            {idp.spec?.enabled ? t('Disable') : t('Enable')}
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

export default IdentityProviderActionsMenu;
