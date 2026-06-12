import * as React from 'react';
import {
  Nav,
  NavGroup,
  NavItem,
  PageSidebar,
  PageSidebarBody,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useLocation, useNavigate } from 'react-router-dom';

import { useSession } from '@osac/ui-components/hooks/use-session';
import { LightDarkToggle } from '@osac/ui-components/LightDarkToggle';
import { type NavLink, navRowsForRole } from './shellNav';
import { shellNavIcon } from './shellNavIcons';

import './ShellSidebar.css';

const ShellNavItem = ({ item }: { item: NavLink }) => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <NavItem
      itemId={item.id}
      icon={shellNavIcon(item.id)}
      isActive={location.pathname === item.path}
      to={item.path}
      onClick={(e) => {
        e.preventDefault();
        navigate(item.path);
      }}
    >
      {item.label}
    </NavItem>
  );
};

export const ShellSidebar = () => {
  const { role, isDarkTheme, setIsDarkTheme } = useSession();

  const navRows = React.useMemo(() => navRowsForRole(role), [role]);

  return (
    <PageSidebar>
      <PageSidebarBody isFilled>
        <Stack className="osac-shell-sidebar__stack">
          <StackItem isFilled>
            <Nav aria-label="Primary navigation">
              {navRows.map((section) => (
                <NavGroup key={section.sectionId} title={section.label}>
                  {section.children.map((item) => (
                    <ShellNavItem key={item.id} item={item} />
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
};
