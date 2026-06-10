import type { ReactNode } from 'react';
import './DashboardActionTile.css';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Content,
  Flex,
  FlexItem,
} from '@patternfly/react-core';

interface DashboardActionTileProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export const DashboardActionTile = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: DashboardActionTileProps) => {
  return (
    <Card isFullHeight>
      <CardHeader>
        <CardTitle>
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            spaceItems={{ default: 'spaceItemsXs' }}
          >
            <FlexItem>{icon}</FlexItem>
            <FlexItem>{title}</FlexItem>
          </Flex>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <Content component="p" className="osac-dashboard-action-tile__description">
          {description}
        </Content>
      </CardBody>
      <CardFooter>
        <Button variant="link" isInline onClick={onAction}>
          {actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
};
