import { useNavigate } from 'react-router-dom';
import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  PageSection,
} from '@patternfly/react-core';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';

import { UnauthorizedErrorState } from './UnauthorizedErrorState';
import { isUnauthorizedError } from '../../utils/unauthorizedError';

type ResourceDetailsPageErrorVariant = 'load-error' | 'not-found' | 'unauthorized';

type ResourceDetailsPageErrorProps = {
  parentTo: string;
  parentLabel: string;
  resourceLabel: string;
  onRetry?: () => void;
} & ({ error: unknown; variant?: never } | { variant: 'not-found'; error?: never });

const resolveVariant = (error: unknown): Exclude<ResourceDetailsPageErrorVariant, 'not-found'> =>
  isUnauthorizedError(error) ? 'unauthorized' : 'load-error';

const variantConfig = (
  resourceLabel: string,
): Record<
  Exclude<ResourceDetailsPageErrorVariant, 'unauthorized'>,
  {
    icon: typeof ExclamationTriangleIcon;
    status: 'danger' | 'warning';
    title: string;
    body: string;
  }
> => ({
  'load-error': {
    icon: ExclamationTriangleIcon,
    status: 'danger',
    title: `Could not load ${resourceLabel}`,
    body: `Unable to load this ${resourceLabel} right now.`,
  },
  'not-found': {
    icon: SearchIcon,
    status: 'warning',
    title: `${resourceLabel.charAt(0).toUpperCase()}${resourceLabel.slice(1)} not found`,
    body: `This ${resourceLabel} could not be found.`,
  },
});

export const ResourceDetailsPageError = ({
  parentTo,
  parentLabel,
  resourceLabel,
  onRetry,
  ...props
}: ResourceDetailsPageErrorProps) => {
  const navigate = useNavigate();
  const variant = props.variant ?? resolveVariant(props.error);

  if (variant === 'unauthorized') {
    return (
      <PageSection hasBodyWrapper={false} isFilled>
        <UnauthorizedErrorState />
      </PageSection>
    );
  }

  const { icon: Icon, status, title, body } = variantConfig(resourceLabel)[variant];

  return (
    <PageSection hasBodyWrapper={false} isFilled>
      <EmptyState icon={Icon} titleText={title} headingLevel="h1" status={status}>
        <EmptyStateBody>{body}</EmptyStateBody>
        <EmptyStateFooter>
          <EmptyStateActions>
            {variant === 'load-error' && onRetry && (
              <Button variant="primary" onClick={onRetry}>
                Retry
              </Button>
            )}
            <Button
              variant={variant === 'load-error' && onRetry ? 'link' : 'primary'}
              onClick={() => navigate(parentTo)}
            >
              Return to {parentLabel.toLowerCase()}
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      </EmptyState>
    </PageSection>
  );
};
