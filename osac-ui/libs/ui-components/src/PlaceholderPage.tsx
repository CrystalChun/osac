import { Stack, StackItem, Title } from '@patternfly/react-core';

import { SubtleContent } from '../components/SubtleContent/SubtleContent';

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
        <SubtleContent component="p">{lede}</SubtleContent>
      </StackItem>
      <StackItem>
        <SubtleContent component="p" className="osac-placeholder-page__note">
          This feature is coming soon. Contact your platform administrator for more information.
        </SubtleContent>
      </StackItem>
    </Stack>
  );
};
