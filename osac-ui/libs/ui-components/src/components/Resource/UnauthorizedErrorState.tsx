import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  type EmptyStateProps,
} from '@patternfly/react-core';
import LockIcon from '@patternfly/react-icons/dist/esm/icons/lock-icon';

import { useTranslation } from '../../hooks/useTranslation';

interface UnauthorizedErrorStateProps {
  headingLevel?: EmptyStateProps['headingLevel'];
}

const signInAgain = () => {
  window.location.href = '/';
};

const UnauthorizedErrorState = ({ headingLevel = 'h2' }: UnauthorizedErrorStateProps) => {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={LockIcon}
      titleText={t('Unauthorized')}
      headingLevel={headingLevel}
      status="warning"
    >
      <EmptyStateBody>
        {t('Your session is missing or no longer valid. Sign in again to continue.')}
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button variant="primary" onClick={signInAgain}>
            {t('Sign in again')}
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};

export default UnauthorizedErrorState;
