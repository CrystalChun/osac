import { Card, CardBody, Content, Stack, StackItem, Title } from '@patternfly/react-core';

import './DashboardMetricCard.css';

interface DashboardMetricCardProps {
  label: string;
  value: number;
}

export const DashboardMetricCard = ({ label, value }: DashboardMetricCardProps) => {
  return (
    <Card isCompact className="osac-dashboard-metric">
      <CardBody>
        <Stack>
          <StackItem>
            <Title headingLevel="h3" size="3xl" className="osac-dashboard-metric__value">
              {value}
            </Title>
          </StackItem>
          <StackItem>
            <Content component="small" className="osac-dashboard-metric__label">
              {label}
            </Content>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};
