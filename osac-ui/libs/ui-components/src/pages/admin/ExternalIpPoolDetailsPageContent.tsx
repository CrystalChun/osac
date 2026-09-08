import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  PageSection,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';

import type { ExternalIPPool } from '@osac/types/private';

import ExternalIpPoolReviewColumn from './externalIpPool/ExternalIpPoolReviewColumn';
import ExternalIpPoolCidrsSection from '../../components/networking/ExternalIpPoolCidrsSection';
import { useTranslation } from '../../hooks/useTranslation';
import { displayValue } from '../../utils/detailFormatters';

interface ExternalIpPoolDetailsPageContentProps {
  pool: ExternalIPPool;
}

const ExternalIpPoolDetailsPageContent = ({ pool }: ExternalIpPoolDetailsPageContentProps) => {
  const { t } = useTranslation();
  const cidrs = pool.spec?.cidrs ?? [];

  return (
    <PageSection hasBodyWrapper={false}>
      <Grid hasGutter>
        <ExternalIpPoolReviewColumn pool={pool} />

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
                  <DescriptionListTerm>{t('Available')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {pool.status ? `${pool.status.available}` : displayValue()}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Total')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {pool.status ? `${pool.status.total}` : displayValue()}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </StackItem>
          </Stack>
        </GridItem>

        <GridItem md={4}>
          <ExternalIpPoolCidrsSection cidrs={cidrs} />
        </GridItem>
      </Grid>
    </PageSection>
  );
};

export default ExternalIpPoolDetailsPageContent;
