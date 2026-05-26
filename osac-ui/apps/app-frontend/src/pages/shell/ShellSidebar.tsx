import {
  Nav,
  NavExpandable,
  NavItem,
  NavList,
  PageSidebar,
  PageSidebarBody,
  Stack,
  StackItem,
} from '@patternfly/react-core'
import { LightDarkToggle } from '@osac/ui-components'
import type { NavRow } from './shellNav'

interface ShellSidebarProps {
  navRows: NavRow[]
  pathname: string
  expandedGroups: Set<string>
  onToggleGroup: (groupId: string, expanded: boolean) => void
  onNavigate: (path: string) => void
  isDarkTheme: boolean
  setIsDarkTheme: (dark: boolean) => void
  onLogout: () => void
}

export function ShellSidebar({
  navRows,
  pathname,
  expandedGroups,
  onToggleGroup,
  onNavigate,
  isDarkTheme,
  setIsDarkTheme,
  onLogout,
}: ShellSidebarProps) {
  return (
    <PageSidebar>
      <PageSidebarBody isFilled>
        <Stack style={{ minHeight: '100%', width: '100%' }}>
          <StackItem isFilled>
            <Nav aria-label="Primary navigation">
              <NavList>
                {navRows.map((row) => {
                  if (row.kind === 'link') {
                    return (
                      <NavItem
                        key={row.id}
                        itemId={row.id}
                        isActive={pathname === row.path}
                        to={row.path}
                        onClick={(e) => {
                          e.preventDefault()
                          onNavigate(row.path)
                        }}
                      >
                        {row.label}
                      </NavItem>
                    )
                  }
                  return (
                    <NavExpandable
                      key={row.groupId}
                      title={row.label}
                      groupId={row.groupId}
                      isExpanded={expandedGroups.has(row.groupId)}
                      onExpand={(_e, expanded) => onToggleGroup(row.groupId, expanded)}
                      isActive={row.children.some((c) => pathname === c.path)}
                    >
                      {row.children.map((child) => (
                        <NavItem
                          key={child.id}
                          itemId={child.id}
                          groupId={row.groupId}
                          isActive={pathname === child.path}
                          to={child.path}
                          onClick={(e) => {
                            e.preventDefault()
                            onNavigate(child.path)
                          }}
                        >
                          {child.label}
                        </NavItem>
                      ))}
                    </NavExpandable>
                  )
                })}
              </NavList>
            </Nav>
          </StackItem>

          <StackItem className="osac-shell-sidebar-footer">
            <LightDarkToggle
              variant="shell"
              isDark={isDarkTheme}
              onChange={setIsDarkTheme}
              landingOnSelect={onLogout}
              landingAriaLabel="Back to welcome — choose institution and role"
              aria-label="Toggle theme"
            />
          </StackItem>
        </Stack>
      </PageSidebarBody>
    </PageSidebar>
  )
}
