import { Breadcrumb, BreadcrumbItem, Button } from '@patternfly/react-core';
import type { DemoShellRole } from '@osac/api-contracts';

interface ShellBreadcrumbProps {
  isRecentActivities: boolean;
  role: DemoShellRole;
  onNavigate: (path: string) => void;
}

export const ShellBreadcrumb = ({ isRecentActivities, role, onNavigate }: ShellBreadcrumbProps) => {
  if (!isRecentActivities) {
    return undefined;
  }

  return (
    <Breadcrumb>
      <BreadcrumbItem>
        <Button
          variant="link"
          isInline
          onClick={() => {
            onNavigate(role === 'providerAdmin' ? '/provider/dashboard' : '/dashboard');
          }}
        >
          Dashboard
        </Button>
      </BreadcrumbItem>
      <BreadcrumbItem isActive>Recent activities</BreadcrumbItem>
    </Breadcrumb>
  );
};
