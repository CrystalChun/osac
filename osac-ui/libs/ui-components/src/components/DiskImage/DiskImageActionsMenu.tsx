import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownList, MenuToggle } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';

import { type DiskImage } from '@osac/types';

import { useTranslation } from '../../hooks/useTranslation';

interface DiskImageActionsMenuProps {
  diskImage: DiskImage;
}

const DiskImageActionsMenu = ({ diskImage }: DiskImageActionsMenuProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const name = diskImage.metadata?.name || diskImage.id;

  return (
    <Dropdown
      isOpen={open}
      onOpenChange={setOpen}
      toggle={(ref) => (
        <MenuToggle
          ref={ref}
          variant="plain"
          onClick={() => setOpen((o) => !o)}
          aria-label={t('Actions for {{name}}', { name })}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
      popperProps={{ position: 'right' }}
    >
      <DropdownList>
        <DropdownItem
          value="view"
          onClick={() => {
            navigate(`/admin/infrastructure/disk-images/${diskImage.id}`);
            setOpen(false);
          }}
        >
          {t('View')}
        </DropdownItem>
        <DropdownItem
          value="edit"
          onClick={() => {
            navigate(`/admin/infrastructure/disk-images/${diskImage.id}/edit`);
            setOpen(false);
          }}
        >
          {t('Edit')}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

export default DiskImageActionsMenu;
