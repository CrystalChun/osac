import type { ReactNode } from 'react';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';

import type { Metadata } from '@osac/types';

import ResourceDetailsColumn from './ResourceDetailsColumn';
import { useTranslation } from '../../hooks/useTranslation';
import { Timestamp } from '../Primitives/Timestamp';

interface ResourceOverviewColumnProps {
  metadata?: Pick<Metadata, 'creationTimestamp'>;
  status?: ReactNode;
  ariaLabel?: string;
}

const ResourceOverviewColumn = ({ metadata, status, ariaLabel }: ResourceOverviewColumnProps) => {
  const { t } = useTranslation();

  return (
    <ResourceDetailsColumn title={t('Overview')} ariaLabel={ariaLabel ?? t('Overview')}>
      {status != null && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
          <DescriptionListDescription>{status}</DescriptionListDescription>
        </DescriptionListGroup>
      )}
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
        <DescriptionListDescription>
          <Timestamp value={metadata?.creationTimestamp} />
        </DescriptionListDescription>
      </DescriptionListGroup>
    </ResourceDetailsColumn>
  );
};

export default ResourceOverviewColumn;
