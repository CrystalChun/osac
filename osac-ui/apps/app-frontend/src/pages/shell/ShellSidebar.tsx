import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Nav, NavGroup, NavItem, PageSidebar, PageSidebarBody } from '@patternfly/react-core';

import { useSession } from '@osac/ui-components/hooks/use-session';

import { type NavLink, navRowsForRole } from './shellNav';
import { shellNavIcon } from './shellNavIcons';

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
  const { role } = useSession();

  const navRows = React.useMemo(() => navRowsForRole(role), [role]);

  return (
    <PageSidebar>
      <PageSidebarBody isFilled>
        <Nav aria-label="Primary navigation">
          {navRows.map((section) => (
            <NavGroup key={section.sectionId} title={section.label}>
              {section.children.map((item) => (
                <ShellNavItem key={item.id} item={item} />
              ))}
            </NavGroup>
          ))}
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};
