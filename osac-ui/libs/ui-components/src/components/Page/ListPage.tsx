import * as React from 'react';
import { Content, Flex, FlexItem, PageSection, Stack, Title } from '@patternfly/react-core';

type ListPageProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  error?: unknown;
  children: React.ReactNode;
};

const ListPage: React.FC<ListPageProps> = ({
  title,
  description,
  actions,
  breadcrumb,
  error,
  children,
}) => (
  <PageSection hasBodyWrapper={false}>
    <Stack hasGutter>
      {breadcrumb}
      <Flex
        gap={{ default: 'gapMd' }}
        alignItems={{ default: 'alignItemsCenter' }}
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
      >
        <FlexItem>
          <Title headingLevel="h1" size="3xl">
            {title}
          </Title>
          {description && <Content component="p">{description}</Content>}
        </FlexItem>
        {actions && !error ? <FlexItem>{actions}</FlexItem> : null}
      </Flex>
    </Stack>
    {children}
  </PageSection>
);

export default ListPage;
