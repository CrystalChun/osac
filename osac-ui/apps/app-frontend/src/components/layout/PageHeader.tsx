import type { ReactNode } from 'react';
import './PageHeader.css';
import { Content, Flex, FlexItem, Title } from '@patternfly/react-core';

type PageHeaderDescriptionWidth = 'medium' | 'wide';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  descriptionWidth?: PageHeaderDescriptionWidth;
  actions?: ReactNode;
}

const DESCRIPTION_WIDTH_CLASS: Record<PageHeaderDescriptionWidth, string> = {
  medium: 'osac-page-toolbar-sticky__description--medium',
  wide: 'osac-page-toolbar-sticky__description--wide',
};

export const PageHeader = ({ title, description, descriptionWidth, actions }: PageHeaderProps) => {
  const descriptionClass = [
    'osac-page-toolbar-sticky__description',
    descriptionWidth ? DESCRIPTION_WIDTH_CLASS[descriptionWidth] : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Flex
      className="osac-page-toolbar-sticky"
      justifyContent={actions ? { default: 'justifyContentSpaceBetween' } : undefined}
      alignItems={actions ? { default: 'alignItemsFlexStart' } : undefined}
    >
      <FlexItem className="osac-page-toolbar-sticky__lead">
        <Title headingLevel="h1" size="2xl" className="osac-page-toolbar-sticky__title">
          {title}
        </Title>
        {description && (
          <Content component="p" className={descriptionClass}>
            {description}
          </Content>
        )}
      </FlexItem>
      {actions && <FlexItem className="osac-page-toolbar-sticky__actions">{actions}</FlexItem>}
    </Flex>
  );
};
