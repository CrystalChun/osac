# Service Helm Chart

This Helm chart deploys the OSAC UI.

## Prerequisites

- OSAC backend

## Installation

To install the chart with the release name `osac-ui`:

```bash
$ helm install osac-ui ./deploy/chart -n osac --create-namespace
```

## Configuration

The following table lists the configurable parameters of the chart and their default values:

| Parameter                                 | Description                                                                                                                                      | Default                        | Required |
|-------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------|----------|
| `externalHostname`                        | External hostname for the OpenShift Route. When not set, the hostname is automatically assigned by OpenShift.                                    | `""`                           | No       |
| `api.fulfillment.url`                     | URL of the Fulfillment API backend.                                                                                                              | `https://fulfillment-api:8000` | Yes      |
| `api.fulfillment.certs.caBundle.configMap`| Name of a ConfigMap in the release namespace that contains trusted CA certificates in PEM format for the Fulfillment API TLS connection.         | `""`                           | Yes      |
| `auth.oidcClientId`                       | OIDC client ID registered in Keycloak (or another OIDC provider) for the UI.                                                                    | `osac-ui`                      | Yes      |
| `auth.certs.caBundle.configMap`           | Name of a ConfigMap in the release namespace that contains trusted CA certificates in PEM format for the OIDC/Auth TLS connection.               | `""`                           | Yes      |
| `log.level`                               | Log level for all components. Valid values: `debug`, `info`, `warn`, `error`. Setting `debug` increases log volume and may impact performance.   | `info`                         | No       |
| `images.ui`                               | Container image for the UI.                                                                                                                      | `ghcr.io/osac-project/osac-ui:main`    | No       |
