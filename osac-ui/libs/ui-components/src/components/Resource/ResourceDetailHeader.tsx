import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  Content,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';

interface ResourceDetailHeaderProps {
  parentTo: string;
  parentLabel: string;
  resourceName: string;
  description?: string;
}

export const ResourceDetailHeader = ({
  parentTo,
  parentLabel,
  resourceName,
  description,
}: ResourceDetailHeaderProps) => {
  return (
    <Stack hasGutter>
      <StackItem>
        <Breadcrumb>
          <BreadcrumbItem
            render={({ className, ariaCurrent }) => (
              <Link className={className} aria-current={ariaCurrent} to={parentTo}>
                {parentLabel}
              </Link>
            )}
          />
          <BreadcrumbItem isActive>{resourceName}</BreadcrumbItem>
        </Breadcrumb>
      </StackItem>

      <StackItem>
        <Stack hasGutter={false}>
          <StackItem>
            <Title headingLevel="h1" size="2xl">
              {resourceName}
            </Title>
          </StackItem>
          {description && (
            <StackItem>
              <Content component="p">{description}</Content>
            </StackItem>
          )}
        </Stack>
      </StackItem>
    </Stack>
  );
};
