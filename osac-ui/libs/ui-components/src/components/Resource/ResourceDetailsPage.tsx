import { ResourceDetailsPageError } from './ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from './ResourceDetailsPageLoading';

interface ResourceDetailsPageProps {
  isLoading: boolean;
  error: unknown;
  found: boolean;
  refetch: VoidFunction;
  parentTo: string;
  parentLabel: string;
  tabLabels?: string[];
}

const ResourceDetailsPage = ({
  isLoading,
  error,
  found,
  refetch,
  parentTo,
  parentLabel,
  tabLabels,
  children,
}: React.PropsWithChildren<ResourceDetailsPageProps>) => {
  if (isLoading) {
    return (
      <ResourceDetailsPageLoading
        parentTo={parentTo}
        parentLabel={parentLabel}
        tabLabels={tabLabels}
      />
    );
  }

  if (error) {
    return (
      <ResourceDetailsPageError
        parentTo={parentTo}
        parentLabel={parentLabel}
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!found) {
    return (
      <ResourceDetailsPageError parentTo={parentTo} parentLabel={parentLabel} variant="not-found" />
    );
  }

  return children;
};

export default ResourceDetailsPage;
