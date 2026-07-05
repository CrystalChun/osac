import * as React from 'react';
import { Content, Flex, FlexItem, PageSection, Title } from '@patternfly/react-core';

type ListPageProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  error?: unknown;
  children: React.ReactNode;
};

const ListPage: React.FC<ListPageProps> = ({ title, description, actions, error, children }) => (
  <PageSection hasBodyWrapper={false}>
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
    {children}
  </PageSection>
);

export default ListPage;
