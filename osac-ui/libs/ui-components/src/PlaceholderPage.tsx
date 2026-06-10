import { Content, Stack, StackItem, Title } from '@patternfly/react-core';
import './PlaceholderPage.css';

interface PlaceholderPageProps {
  title: string;
  lede: string;
}

export const PlaceholderPage = ({ title, lede }: PlaceholderPageProps) => {
  return (
    <Stack hasGutter className="osac-placeholder-page">
      <StackItem>
        <Title headingLevel="h1" size="2xl">
          {title}
        </Title>
      </StackItem>
      <StackItem>
        <Content component="p" className="osac-placeholder-page__description">
          {lede}
        </Content>
      </StackItem>
      <StackItem>
        <Content component="p" className="osac-placeholder-page__note">
          This feature is coming soon. Contact your platform administrator for more information.
        </Content>
      </StackItem>
    </Stack>
  );
};
