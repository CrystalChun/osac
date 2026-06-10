import { BarsIcon } from '@patternfly/react-icons/dist/esm/icons/bars-icon';
import { UserIcon } from '@patternfly/react-icons/dist/esm/icons/user-icon';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Label,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadLogo,
  MastheadMain,
  MastheadToggle,
  MenuToggle,
  PageToggleButton,
  Title,
} from '@patternfly/react-core';
import type { DemoShellRole, DemoTenantId } from '@osac/api-contracts/types';
import { operatingModeLabel } from '@osac/api-contracts/shellLabels';
import './ShellMasthead.css';

interface ShellMastheadProps {
  selectedTenant: DemoTenantId | null;
  role: DemoShellRole;
  displayName: string;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (open: boolean) => void;
  onLogout: () => void;
}

export const ShellMasthead = ({
  selectedTenant: _selectedTenant,
  role,
  displayName,
  isUserMenuOpen,
  setIsUserMenuOpen,
  onLogout,
}: ShellMastheadProps) => {
  return (
    <Masthead display={{ default: 'inline' }}>
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton variant="plain" aria-label="Global navigation">
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
        <MastheadLogo>
          <MastheadBrand>
            <Title headingLevel="h4" size="lg" className="osac-masthead__brand-title">
              Red Hat OSAC
            </Title>
          </MastheadBrand>
        </MastheadLogo>
      </MastheadMain>

      <MastheadContent className="osac-masthead-content">
        <Flex
          className="osac-masthead-content-rail"
          direction={{ default: 'row' }}
          flexWrap={{ default: 'wrap' }}
          alignItems={{ default: 'alignItemsCenter' }}
          justifyContent={{ default: 'justifyContentFlexEnd' }}
          spaceItems={{ default: 'spaceItemsMd' }}
        >
          <Flex className="osac-masthead-user-cluster" spaceItems={{ default: 'spaceItemsSm' }}>
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
                  {displayName}
                  <Label
                    color="grey"
                    variant="outline"
                    isCompact
                    className="osac-masthead-operating-mode"
                  >
                    {operatingModeLabel(role)}
                  </Label>
                </MenuToggle>
              )}
            >
              <DropdownList>
                <DropdownItem value="logout" onClick={onLogout}>
                  Log out
                </DropdownItem>
              </DropdownList>
            </Dropdown>
          </Flex>
        </Flex>
      </MastheadContent>
    </Masthead>
  );
};
