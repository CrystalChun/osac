import { Card, CardBody, Content, Stack, StackItem, Title } from '@patternfly/react-core'

interface DashboardMetricCardProps {
  label: string
  value: number
}

export function DashboardMetricCard({ label, value }: DashboardMetricCardProps) {
  return (
    <Card isCompact style={{ minWidth: 120 }}>
      <CardBody>
        <Stack>
          <StackItem>
            <Title headingLevel="h3" size="3xl" style={{ margin: 0 }}>
              {value}
            </Title>
          </StackItem>
          <StackItem>
            <Content
              component="small"
              style={{ color: 'var(--pf-t--global--text--color--subtle)' }}
            >
              {label}
            </Content>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  )
}
