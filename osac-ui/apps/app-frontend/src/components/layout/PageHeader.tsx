import type { ReactNode } from 'react'
import { Content, Flex, FlexItem, Title } from '@patternfly/react-core'

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  descriptionMaxWidth?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, descriptionMaxWidth, actions }: PageHeaderProps) {
  return (
    <Flex
      className="osac-page-toolbar-sticky"
      justifyContent={actions ? { default: 'justifyContentSpaceBetween' } : undefined}
      alignItems={actions ? { default: 'alignItemsFlexStart' } : undefined}
    >
      <FlexItem className="osac-page-toolbar-sticky__lead">
        <Title headingLevel="h1" size="2xl" style={{ margin: 0 }}>
          {title}
        </Title>
        {description && (
          <Content
            component="p"
            style={{
              margin: 0,
              color: 'var(--pf-t--global--text--color--subtle)',
              ...(descriptionMaxWidth ? { maxWidth: descriptionMaxWidth } : {}),
            }}
          >
            {description}
          </Content>
        )}
      </FlexItem>
      {actions && (
        <FlexItem className="osac-page-toolbar-sticky__actions" style={{ flexShrink: 0 }}>
          {actions}
        </FlexItem>
      )}
    </Flex>
  )
}
