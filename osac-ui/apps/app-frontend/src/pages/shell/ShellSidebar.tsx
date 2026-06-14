import {
  Nav,
  NavGroup,
  NavItem,
  PageSidebar,
  PageSidebarBody,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { LightDarkToggle } from '@osac/ui-components/LightDarkToggle';
import type { NavLink } from './shellNav';
import { shellNavIcon } from './shellNavIcons';
import './ShellSidebar.css';

interface ShellSidebarProps {
  navRows: { sectionId: string; label: string; children: NavLink[] }[];
  pathname: string;
  onNavigate: (path: string) => void;
  isDarkTheme: boolean;
  setIsDarkTheme: (dark: boolean) => void;
}

const ShellNavItem = ({
  item,
  pathname,
  onNavigate,
}: {
  item: NavLink;
  pathname: string;
  onNavigate: (path: string) => void;
}) => (
  <NavItem
    itemId={item.id}
    icon={shellNavIcon(item.id)}
    isActive={pathname === item.path}
    to={item.path}
    onClick={(e) => {
      e.preventDefault();
      onNavigate(item.path);
    }}
  >
    {item.label}
  </NavItem>
);

export const ShellSidebar = ({
  navRows,
  pathname,
  onNavigate,
  isDarkTheme,
  setIsDarkTheme,
}: ShellSidebarProps) => (
  <PageSidebar>
    <PageSidebarBody isFilled>
      <Stack className="osac-shell-sidebar__stack">
        <StackItem isFilled>
          <Nav aria-label="Primary navigation">
            {navRows.map((section) => (
              <NavGroup key={section.sectionId} title={section.label}>
                {section.children.map((item) => (
                  <ShellNavItem
                    key={item.id}
                    item={item}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ))}
              </NavGroup>
            ))}
          </Nav>
        </StackItem>

        <StackItem className="osac-shell-sidebar-footer">
          <LightDarkToggle
            variant="shell"
            isDark={isDarkTheme}
            onChange={setIsDarkTheme}
            aria-label="Toggle theme"
          />
        </StackItem>
      </Stack>
    </PageSidebarBody>
  </PageSidebar>
);
