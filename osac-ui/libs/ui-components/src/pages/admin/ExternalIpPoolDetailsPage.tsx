import { useParams } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  FlexItem,
  List,
  ListItem,
  PageSection,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import { ExternalIPPools } from '@osac/types/private';

import { useGetResource } from '../../api/use-resource';
import ExternalIpPoolDetailsActionButtons from '../../components/networking/ExternalIpPoolDetailsActionButtons';
import { ipFamilyLabel } from '../../components/networking/ExternalIpPoolsTable';
import ExternalIpPoolStatusLabel from '../../components/networking/ExternalIpPoolStatusLabel';
import { ResourceDetailHeader } from '../../components/Resource/ResourceDetailHeader';
import { ResourceDetailsPageError } from '../../components/Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../../components/Resource/ResourceDetailsPageLoading';
import { useTranslation } from '../../hooks/useTranslation';
import { displayValue } from '../../utils/detailFormatters';

import './ExternalIpPoolDetailsPage.css';

const POOLS_LIST_PATH = '/admin/infrastructure/external-ip-pools';

export const ExternalIpPoolDetailsPage = () => {
  const { t } = useTranslation();
  const { id = '' } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useGetResource(ExternalIPPools, { id });
  const pool = data?.object;

  if (isLoading) {
    return (
      <ResourceDetailsPageLoading
        parentTo={POOLS_LIST_PATH}
        parentLabel={t('External IP pools')}
        cardCount={2}
      />
    );
  }

  if (error) {
    return (
      <ResourceDetailsPageError
        parentTo={POOLS_LIST_PATH}
        parentLabel={t('External IP pools')}
        resourceLabel={t('external IP pool')}
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!pool) {
    return (
      <ResourceDetailsPageError
        parentTo={POOLS_LIST_PATH}
        parentLabel={t('External IP pools')}
        resourceLabel={t('external IP pool')}
        variant="not-found"
      />
    );
  }

  const cidrs = pool.spec?.cidrs ?? [];

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <StackItem>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem>
                <ResourceDetailHeader
                  parentTo={POOLS_LIST_PATH}
                  parentLabel={t('External IP pools')}
                  resourceName={pool.metadata?.name || pool.id}
                  titleAddon={<ExternalIpPoolStatusLabel state={pool.status?.state} />}
                />
              </FlexItem>
              <FlexItem>
                <ExternalIpPoolDetailsActionButtons pool={pool} />
              </FlexItem>
            </Flex>
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <StackItem>
            <Card>
              <CardBody>
                <DescriptionList isCompact>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('IP family')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {ipFamilyLabel(pool.spec?.ipFamily)}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Available / Total')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {pool.status
                        ? `${pool.status.available} / ${pool.status.total}`
                        : displayValue()}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Allocated')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {pool.status ? `${pool.status.allocated}` : displayValue()}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Implementation strategy')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {displayValue(pool.spec?.implementationStrategy)}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  {pool.status?.message && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Status message')}</DescriptionListTerm>
                      <DescriptionListDescription>{pool.status.message}</DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                </DescriptionList>
              </CardBody>
            </Card>
          </StackItem>

          <StackItem>
            <Card>
              <CardTitle>{t('CIDRs')}</CardTitle>
              <CardBody>
                {cidrs.length === 0 ? (
                  displayValue()
                ) : (
                  <div className="osac-external-ip-pool-cidrs">
                    <List isPlain>
                      {cidrs.map((cidr) => (
                        <ListItem key={cidr}>{cidr}</ListItem>
                      ))}
                    </List>
                  </div>
                )}
              </CardBody>
            </Card>
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};
