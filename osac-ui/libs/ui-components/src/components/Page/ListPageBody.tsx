import * as React from 'react';
import { Alert, Bullseye, Spinner } from '@patternfly/react-core';

import { getErrorMessage } from '../../utils/error';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';

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
    return (
      <Alert variant="danger" title="An error occurred" isInline>
        {getErrorMessage(error)}
      </Alert>
    );
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default ListPageBody;
