import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
} from '@patternfly/react-core';
import LockIcon from '@patternfly/react-icons/dist/esm/icons/lock-icon';

const signInAgain = async () => {
  try {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // Best effort before restarting login.
  }
  window.location.href = '/';
};

export const UnauthorizedErrorState = () => (
  <EmptyState icon={LockIcon} titleText="Unauthorized" headingLevel="h2" status="warning">
    <EmptyStateBody>
      Your session is missing or no longer valid. Sign in again to continue.
    </EmptyStateBody>
    <EmptyStateFooter>
      <EmptyStateActions>
        <Button variant="primary" onClick={() => void signInAgain()}>
          Sign in again
        </Button>
      </EmptyStateActions>
    </EmptyStateFooter>
  </EmptyState>
);
