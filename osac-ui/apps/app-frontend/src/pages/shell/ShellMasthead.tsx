import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  Label,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadLogo,
  MastheadMain,
  MastheadToggle,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageToggleButton,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons/dist/esm/icons/bars-icon';
import { UserIcon } from '@patternfly/react-icons/dist/esm/icons/user-icon';

import UserPreferencesModal from '@osac/ui-components/components/UserPreferences/UserPreferencesModal';
import { useSession } from '@osac/ui-components/hooks/use-session';
import { getErrorMessage } from '@osac/ui-components/utils/error';

import { operatingModeLabel } from './shellLabels';

interface ShellMastheadProps {
  onLogout: () => Promise<void>;
}

export const ShellMasthead = ({ onLogout }: ShellMastheadProps) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isPreferencesOpen, setPreferencesOpen] = React.useState(false);
  const [logoutError, setLogoutError] = React.useState<string>();
  const navigate = useNavigate();
  const { role, username } = useSession();

  const displayName = username || 'User';

  return (
    <>
      {logoutError && (
        <Modal variant="small" isOpen onClose={() => setLogoutError(undefined)}>
          <ModalHeader title="Logout failed" titleIconVariant="danger" />
          <ModalBody>
            <Alert variant="danger" isInline title={logoutError ?? ''} />
          </ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={() => setLogoutError(undefined)}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}
      {isPreferencesOpen && <UserPreferencesModal onClose={() => setPreferencesOpen(false)} />}
      <Masthead display={{ default: 'inline' }}>
        <MastheadMain>
          <MastheadToggle>
            <PageToggleButton variant="plain" aria-label="Global navigation">
              <BarsIcon />
            </PageToggleButton>
          </MastheadToggle>
          <MastheadLogo>
            <MastheadBrand>
              <Title headingLevel="h4" size="lg">
                Red Hat OSAC
              </Title>
            </MastheadBrand>
          </MastheadLogo>
        </MastheadMain>

        <MastheadContent>
          <Toolbar id="toolbar" isStatic>
            <ToolbarContent>
              <ToolbarGroup
                variant="action-group-plain"
                align={{ default: 'alignEnd' }}
                gap={{ default: 'gapNone', md: 'gapMd' }}
              >
                <ToolbarItem>
                  <Dropdown
                    isOpen={isUserMenuOpen}
                    onSelect={() => setIsUserMenuOpen(false)}
                    onOpenChange={setIsUserMenuOpen}
                    popperProps={{ position: 'right' }}
                    toggle={(ref) => (
                      <MenuToggle
                        ref={ref}
                        isExpanded={isUserMenuOpen}
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        icon={<UserIcon />}
                        aria-label="Account menu"
                      >
                        {displayName}{' '}
                        <Label color="grey" variant="outline" isCompact>
                          {operatingModeLabel(role)}
                        </Label>
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      <DropdownItem onClick={() => setPreferencesOpen(true)}>
                        Preferences
                      </DropdownItem>
                      <DropdownItem
                        onClick={async () => {
                          try {
                            await onLogout();
                            navigate('/');
                          } catch (e) {
                            setLogoutError(getErrorMessage(e));
                          }
                        }}
                      >
                        Log out
                      </DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </ToolbarItem>
              </ToolbarGroup>
            </ToolbarContent>
          </Toolbar>
        </MastheadContent>
      </Masthead>
    </>
  );
};
