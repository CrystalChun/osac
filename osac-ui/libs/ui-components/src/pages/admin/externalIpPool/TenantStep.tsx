import { Alert, Content, Stack, StackItem, Title } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { Tenants } from '@osac/types/private';
import { useListResource } from '@osac/ui-components/api/use-resource';
import OsacForm from '@osac/ui-components/components/Form/OsacForm';
import { SelectField } from '@osac/ui-components/components/Form/SelectField';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import type { ExternalIpPoolFormValues } from './values';

const TenantStep = () => {
  const { t } = useTranslation();
  const { values } = useFormikContext<ExternalIpPoolFormValues>();
  const { data: tenantsResponse, isLoading } = useListResource(Tenants);
  const tenants = tenantsResponse?.items ?? [];
  const selectedTenant = tenants.find((tenant) => tenant.id === values.metadata.tenant);

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="lg">
          {t('Tenant')}
        </Title>
      </StackItem>
      <StackItem>
        <Content component="p">
          {t(
            'Assign this pool to a tenant. Tenants can have multiple pools for different regions or environments.',
          )}
        </Content>
      </StackItem>
      <StackItem>
        {!isLoading && tenants.length === 0 ? (
          <Alert variant="warning" isInline title={t('No registered tenants')}>
            <Content component="p">
              {t('Register a tenant before creating and assigning an external IP pool.')}
            </Content>
          </Alert>
        ) : (
          <OsacForm>
            <SelectField
              name="metadata.tenant"
              label={t('Tenant')}
              fieldId="external-ip-pool-tenant"
              isRequired
              isLoading={isLoading}
              autoSelectSingleOption
              placeholder={t('Select a tenant')}
              options={tenants.map((tenant) => ({
                label: tenant.metadata?.name || tenant.id,
                value: tenant.id,
              }))}
            />
            {selectedTenant ? (
              <Content component="p">
                {t('{{tenant}} will receive this address pool for tenant edge exposure.', {
                  tenant: selectedTenant.metadata?.name || selectedTenant.id,
                })}
              </Content>
            ) : null}
          </OsacForm>
        )}
      </StackItem>
    </Stack>
  );
};

export default TenantStep;
