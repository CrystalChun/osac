/**
 * flow: recent-activities
 * step: ra_activity_feed
 */
import { useMemo } from 'react';
import {
  Content,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Label,
  PageSection,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { buildRecentActivities } from '@osac/api-contracts';
import { useComputeInstances } from '../../api/hooks';

const SEVERITY_COLOR: Record<string, 'green' | 'orange' | 'red' | 'blue' | 'grey'> = {
  success: 'green',
  warning: 'orange',
  danger: 'red',
  info: 'blue',
};

export const RecentActivitiesPage = () => {
  const { data: vms = [] } = useComputeInstances();
  const activities = useMemo(() => buildRecentActivities(vms, 30), [vms]);

  return (
    <PageSection>
      <Stack style={{ maxWidth: '800px' }}>
        <StackItem>
          <Title
            headingLevel="h1"
            size="2xl"
            style={{ marginBottom: 'var(--pf-t--global--spacer--lg)' }}
          >
            Recent activities
          </Title>
        </StackItem>

        <StackItem>
          {activities.length === 0 ? (
            <Content component="p" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
              No recent activities to display.
            </Content>
          ) : (
            <DataList aria-label="Recent activities" className="osac-activity-list">
              {activities.map((event) => (
                <DataListItem key={event.id} aria-labelledby={`activity-${event.id}`}>
                  <DataListItemRow>
                    <DataListItemCells
                      dataListCells={[
                        <DataListCell key={`severity-${event.id}`} width={1}>
                          <Label
                            color={SEVERITY_COLOR[event.severity ?? 'info'] ?? 'blue'}
                            isCompact
                            variant="outline"
                          >
                            {event.type}
                          </Label>
                        </DataListCell>,
                        <DataListCell key={`message-${event.id}`} width={4}>
                          <Content
                            id={`activity-${event.id}`}
                            component="p"
                            style={{
                              margin: 0,
                              fontWeight: 'var(--pf-t--global--font--weight--heading--bold)',
                            }}
                          >
                            {event.message ?? event.type}
                          </Content>
                          {event.relatedObjectRefs && event.relatedObjectRefs.length > 0 && (
                            <Content
                              component="small"
                              style={{ color: 'var(--pf-t--global--text--color--subtle)' }}
                            >
                              {event.relatedObjectRefs.map((r) => r.name ?? r.id).join(', ')}
                            </Content>
                          )}
                        </DataListCell>,
                        <DataListCell key={`time-${event.id}`} alignRight>
                          <Content
                            component="small"
                            style={{ color: 'var(--pf-t--global--text--color--subtle)' }}
                          >
                            {new Date(event.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            {new Date(event.timestamp).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Content>
                        </DataListCell>,
                      ]}
                    />
                  </DataListItemRow>
                </DataListItem>
              ))}
            </DataList>
          )}
        </StackItem>
      </Stack>
    </PageSection>
  );
};
