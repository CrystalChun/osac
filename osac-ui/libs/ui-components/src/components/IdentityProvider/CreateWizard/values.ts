import { IdentityProvider } from '@osac/types';

export interface IdentityProviderValues {
  metadata: {
    name: string;
  };
  spec: {
    title: string;
    description: string;
    config: {
      authorizationUrl: string;
      tokenUrl: string;
      clientId: string;
      clientSecret: string;
      issuer: string;
      defaultScopes: string;
      userInfoUrl: string;
      jwksUrl: string;
      validateSignature: boolean;
      logoutUrl: string;
    };
  };
}

export const getIdentityProviderValues = (idp?: IdentityProvider): IdentityProviderValues => {
  const initValues: IdentityProviderValues = {
    metadata: {
      name: idp?.metadata?.name || '',
    },
    spec: {
      description: idp?.spec?.description || '',
      title: idp?.spec?.title || '',
      config: {
        authorizationUrl: '',
        clientId: '',
        clientSecret: '',
        defaultScopes: '',
        issuer: '',
        jwksUrl: '',
        logoutUrl: '',
        tokenUrl: '',
        userInfoUrl: '',
        validateSignature: true,
      },
    },
  };

  if (idp?.spec?.config.case === 'oidc') {
    const { $typeName: _, ...oidcValues } = idp.spec.config.value;
    initValues.spec.config = {
      ...oidcValues,
      defaultScopes: idp.spec.config.value.defaultScopes || '',
      userInfoUrl: idp.spec.config.value.userInfoUrl || '',
      jwksUrl: idp.spec.config.value.jwksUrl || '',
      logoutUrl: idp.spec.config.value.logoutUrl || '',
      validateSignature: idp.spec.config.value.validateSignature === false ? false : true,
    };
  }

  return initValues;
};
