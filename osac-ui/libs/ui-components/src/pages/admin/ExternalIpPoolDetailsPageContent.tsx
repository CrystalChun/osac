import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  Label,
  PageSection,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';

import type { ExternalIPPool } from '@osac/types/private';

import ExternalIpPoolCidrsSection from '../../components/networking/ExternalIpPoolCidrsSection';
import { ipFamilyLabel } from '../../components/networking/ExternalIpPoolsTable';
import ExternalIpPoolStatusLabel from '../../components/networking/ExternalIpPoolStatusLabel';
import ResourceDetailsColumn from '../../components/Resource/ResourceDetailsColumn';
import ResourceOverviewColumn from '../../components/Resource/ResourceOverviewColumn';
import { useTranslation } from '../../hooks/useTranslation';
import { displayValue } from '../../utils/detailFormatters';

const SHARED_TENANT = 'shared';

interface ExternalIpPoolDetailsPageContentProps {
  pool: ExternalIPPool;
}

const ExternalIpPoolDetailsPageContent = ({ pool }: ExternalIpPoolDetailsPageContentProps) => {
  const { t } = useTranslation();
  const cidrs = pool.spec?.cidrs ?? [];
  const tenantId = pool.metadata?.tenant;
  const isShared = !tenantId || tenantId === SHARED_TENANT;

  return (
    <PageSection hasBodyWrapper={false}>
      <Grid hasGutter>
        <ResourceOverviewColumn
          metadata={pool.metadata}
          status={<ExternalIpPoolStatusLabel state={pool.status?.state} />}
          ariaLabel={t('External IP pool overview')}
        />

        <GridItem md={4}>
          <Stack hasGutter>
            <StackItem>
              <Title headingLevel="h2" size="lg">
                {t('Capacity')}
              </Title>
            </StackItem>
            <StackItem>
              <DescriptionList isCompact aria-label={t('External IP pool capacity')}>
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
              </DescriptionList>
            </StackItem>
            <StackItem>
              <ExternalIpPoolCidrsSection cidrs={cidrs} />
            </StackItem>
          </Stack>
        </GridItem>

        <ResourceDetailsColumn title={t('Assignment')} ariaLabel={t('External IP pool assignment')}>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Tenant')}</DescriptionListTerm>
            <DescriptionListDescription>
              {isShared ? (
                <Label color="green" isCompact>
                  {t('Shared')}
                </Label>
              ) : (
                tenantId
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </ResourceDetailsColumn>
      </Grid>
    </PageSection>
  );
};

export default ExternalIpPoolDetailsPageContent;
