import type { TFunction } from 'i18next';
import * as yup from 'yup';

const DNS_LABEL_PATTERN = /^[a-z0-9-]+$/;

/** Yup schema for metadata.name — aligned with fulfillment-service validateName (RFC 1035 DNS labels). */
export const buildMetadataNameSchema = (t: TFunction): yup.StringSchema =>
  yup
    .string()
    .trim()
    .required(t('catalogProvision.validation.nameRequired'))
    .max(63, t('catalogProvision.validation.nameDnsLabelMaxLength'))
    .test('dns-label-charset', t('catalogProvision.validation.nameDnsLabelCharset'), (value) => {
      if (!value) {
        return true;
      }
      return DNS_LABEL_PATTERN.test(value);
    })
    .test(
      'dns-label-leading-hyphen',
      t('catalogProvision.validation.nameDnsLabelLeadingHyphen'),
      (value) => !value || !value.startsWith('-'),
    )
    .test(
      'dns-label-trailing-hyphen',
      t('catalogProvision.validation.nameDnsLabelTrailingHyphen'),
      (value) => !value || !value.endsWith('-'),
    );
