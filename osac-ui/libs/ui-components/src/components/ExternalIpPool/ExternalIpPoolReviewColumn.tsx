import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';

import type { ExternalIPPool } from '@osac/types/private';

import ExternalIpPoolStatusLabel from './ExternalIpPoolStatusLabel';
import { useTranslation } from '../../hooks/useTranslation';
import { Timestamp } from '../Primitives/Timestamp';
import ResourceDetailsColumn from '../Resource/ResourceDetailsColumn';

const SHARED_TENANT = 'shared';

interface ExternalIpPoolReviewColumnProps {
  pool: ExternalIPPool;
}

const ExternalIpPoolReviewColumn = ({ pool }: ExternalIpPoolReviewColumnProps) => {
  const { t } = useTranslation();
  const tenant = pool.metadata?.tenant;

  return (
    <ResourceDetailsColumn title={t('Overview')} ariaLabel={t('External IP pool overview')}>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
        <DescriptionListDescription>
          <ExternalIpPoolStatusLabel state={pool.status?.state} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
        <DescriptionListDescription>
          <Timestamp value={pool.metadata?.creationTimestamp} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      {tenant ? (
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Tenant')}</DescriptionListTerm>
          <DescriptionListDescription>
            {tenant === SHARED_TENANT ? t('Shared') : tenant}
          </DescriptionListDescription>
        </DescriptionListGroup>
      ) : null}
    </ResourceDetailsColumn>
  );
};

export default ExternalIpPoolReviewColumn;
