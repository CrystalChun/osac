import { Stack, StackItem, Title } from '@patternfly/react-core';

import { InputField } from '@osac/ui-components/components/Form/InputField';
import OsacForm from '@osac/ui-components/components/Form/OsacForm';

import { useTranslation } from '../../../../hooks/useTranslation';

const IdpConfigurationStep = () => {
  const { t } = useTranslation();
  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="lg">
          {t('OIDC configuration')}
        </Title>
      </StackItem>
      <StackItem>
        <OsacForm>
          <InputField
            name="spec.config.clientId"
            label={t('Client ID')}
            fieldId="idp-client-id"
            isRequired
          />
          <InputField
            name="spec.config.clientSecret"
            label={t('Client secret')}
            fieldId="idp-client-secret"
            type="password"
            isRequired
          />
          <InputField
            name="spec.config.issuer"
            label={t('Issuer')}
            fieldId="idp-issuer"
            isRequired
          />
          <InputField
            name="spec.config.authorizationUrl"
            label={t('Authorization URL')}
            fieldId="idp-authorization-url"
            isRequired
          />
          <InputField
            name="spec.config.tokenUrl"
            label={t('Token URL')}
            fieldId="idp-token-url"
            isRequired
          />
          <InputField
            name="spec.config.defaultScopes"
            label={t('Default scopes')}
            fieldId="idp-default-scopes"
            helperText={t('Space-separated list of scopes (e.g. openid profile email)')}
          />
          <InputField
            name="spec.config.userInfoUrl"
            label={t('User info URL')}
            fieldId="idp-user-info-url"
          />
          <InputField name="spec.config.jwksUrl" label={t('JWKS URL')} fieldId="idp-jwks-url" />
          <InputField
            name="spec.config.logoutUrl"
            label={t('Logout URL')}
            fieldId="idp-logout-url"
          />
        </OsacForm>
      </StackItem>
    </Stack>
  );
};

export default IdpConfigurationStep;
