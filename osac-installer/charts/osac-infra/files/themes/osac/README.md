# OSAC Custom Keycloak Theme

This custom theme provides improved error messaging for identity provider (IDP) login failures across all OSAC tenants.

## Overview

When users attempt to log in using a misconfigured or unreachable external OIDC identity provider, they will see user-friendly error messages instead of generic Keycloak errors.

## Theme Structure

```
osac/
└── login/
    ├── theme.properties          # Theme configuration (extends base Keycloak theme)
    ├── messages/
    │   └── messages_en.properties # Custom error messages for IDP failures
    └── error.ftl                 # Custom error page template with helpful guidance
```

## How It Works

1. **Realm Configuration**: The OSAC realm (`osac`) is configured to use this theme via `loginTheme: "osac"` in `realm.json`

2. **Deployment**: The theme files are mounted as a ConfigMap into the Keycloak container at `/opt/keycloak/themes/osac/login`

3. **Single Configuration**: Since all OSAC tenants share the same Keycloak realm, this theme automatically applies to all organizations

## Custom Error Messages

The theme provides specific error messages for common IDP failure scenarios:

- **Unreachable IDP**: When the external OIDC provider is down or network connectivity fails
- **Configuration Errors**: Missing client ID, client secret, or invalid issuer
- **SSL/Certificate Errors**: TLS handshake failures with the IDP
- **Invalid Responses**: Malformed tokens or unexpected responses from the IDP
- **Authentication Failures**: When the IDP rejects the user's credentials

Each error message:
- Explains what went wrong in user-friendly language
- Suggests next steps (retry, contact admin, use alternative login)
- References the admin console for administrators to check IDP status

## Customization

### Adding New Error Messages

Edit `login/messages/messages_en.properties` and add new message keys. Common Keycloak IDP error message keys:

- `identityProviderUnexpectedErrorMessage`
- `identityProviderAuthenticationFailed`
- `identityProviderNotFoundMessage`
- `identityProviderDisabledMessage`
- `brokerLinkingSessionExpired`

### Changing the Error Page Layout

Edit `login/error.ftl` to customize the HTML structure and styling of the error page.

### Adding Custom CSS

1. Create `login/resources/css/custom.css`
2. Uncomment the `styles` line in `theme.properties`
3. Update the ConfigMap in `templates/keycloak/resources.yaml` to include the CSS file

## Testing

After deploying the theme:

1. Create a test IdentityProvider with an unreachable OIDC endpoint
2. Attempt to log in using that provider
3. Verify the custom error message appears instead of the generic Keycloak error

## Integration with IdentityProvider Reconciler

This theme complements the IdentityProvider controller's status reporting:

- **Controller**: Sets `status.phase = ERROR` and `status.message` when IDP sync fails (admin-facing)
- **Theme**: Shows friendly error messages to end-users during login attempts (user-facing)

Both work together to provide visibility into IDP configuration issues at different levels.

## References

- [Keycloak Theme Documentation](https://www.keycloak.org/docs/latest/server_development/#_themes)
- [Keycloak Message Properties](https://github.com/keycloak/keycloak/blob/main/themes/src/main/resources/theme/base/login/messages/messages_en.properties)
- OSAC IdentityProvider controller: `fulfillment-service/internal/controllers/identityprovider/`
