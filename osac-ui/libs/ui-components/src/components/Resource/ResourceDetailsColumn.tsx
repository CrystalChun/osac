import type { ReactNode } from 'react';
import { DescriptionList, GridItem, Stack, StackItem, Title } from '@patternfly/react-core';

interface ResourceDetailsColumnProps {
  title: string;
  ariaLabel: string;
  children: ReactNode;
}

const ResourceDetailsColumn = ({ title, ariaLabel, children }: ResourceDetailsColumnProps) => (
  <GridItem md={4}>
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="lg">
          {title}
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList isCompact aria-label={ariaLabel}>
          {children}
        </DescriptionList>
      </StackItem>
    </Stack>
  </GridItem>
);

export default ResourceDetailsColumn;
