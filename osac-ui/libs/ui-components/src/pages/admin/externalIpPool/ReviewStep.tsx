import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { Tenants } from '@osac/types/private';
import { useListResource } from '@osac/ui-components/api/use-resource';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import { displayValue } from '@osac/ui-components/utils/detailFormatters';

import type { ExternalIpPoolFormValues } from './values';

const ReviewStep = () => {
  const { t } = useTranslation();
  const { values } = useFormikContext<ExternalIpPoolFormValues>();
  const { data: tenantsResponse } = useListResource(Tenants);
  const tenants = tenantsResponse?.items ?? [];
  const selectedTenant = tenants.find((tenant) => tenant.id === values.metadata.tenant);
  const ipFamilyLabel =
    values.ipFamily === 'ipv4'
      ? t('IPv4')
      : values.ipFamily === 'ipv6'
        ? t('IPv6')
        : displayValue();

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="lg">
          {t('Review')}
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal isCompact aria-label={t('Review')}>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
            <DescriptionListDescription>
              {displayValue(values.metadata.name)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('IP family')}</DescriptionListTerm>
            <DescriptionListDescription>{ipFamilyLabel}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('CIDRs')}</DescriptionListTerm>
            <DescriptionListDescription>
              {values.cidrs.filter((cidr) => cidr.trim()).join(', ') || displayValue()}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Tenant')}</DescriptionListTerm>
            <DescriptionListDescription>
              {displayValue(selectedTenant?.metadata?.name || values.metadata.tenant)}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
    </Stack>
  );
};

export default ReviewStep;
