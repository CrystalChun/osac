import * as React from 'react';
import { Alert, Bullseye, Spinner } from '@patternfly/react-core';

import { getErrorMessage } from '../../utils/error';
import { isUnauthorizedError } from '../../utils/unauthorizedError';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';
import { UnauthorizedErrorState } from '../Resource/UnauthorizedErrorState';

type ListPageBodyProps = {
  isLoading: boolean;
  error: unknown;
};

const ListPageBody = ({
  isLoading,
  error,
  children,
}: React.PropsWithChildren<ListPageBodyProps>) => {
  if (isLoading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }
  if (error) {
    if (isUnauthorizedError(error)) {
      return <UnauthorizedErrorState />;
    }
    return (
      <Alert variant="danger" title="An error occurred" isInline>
        {getErrorMessage(error)}
      </Alert>
    );
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default ListPageBody;
