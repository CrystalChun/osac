import { FormGroup, FormSelect, FormSelectOption, TextInput } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { Protocol } from '@osac/types';

import { FormFieldHelper } from '../Form/FormFieldHelper';
import { useTranslation } from '../../hooks/useTranslation';

export interface RuleFormValues {
  protocol: Protocol;
  portFrom: string;
  portTo: string;
  ipv4Cidr: string;
  ipv6Cidr: string;
}

interface SecurityGroupRuleFormProps {
  direction: 'ingress' | 'egress';
}

export const SecurityGroupRuleForm = ({ direction }: SecurityGroupRuleFormProps) => {
  const { t } = useTranslation();
  const { values, errors, touched, setFieldValue, handleChange, handleBlur } =
    useFormikContext<RuleFormValues>();

  const showPortRange =
    values.protocol === Protocol.TCP || values.protocol === Protocol.UDP;
  const cidrLabel = direction === 'ingress' ? t('Source CIDR') : t('Destination CIDR');

  return (
    <>
      <FormGroup label={t('Protocol')} isRequired fieldId="rule-protocol">
        <FormSelect
          id="rule-protocol"
          name="protocol"
          value={values.protocol}
          onChange={(_event, value) => setFieldValue('protocol', Number(value))}
          onBlur={handleBlur}
          validated={touched.protocol && errors.protocol ? 'error' : 'default'}
          aria-label={t('Protocol')}
        >
          <FormSelectOption value={Protocol.TCP} label={t('TCP')} />
          <FormSelectOption value={Protocol.UDP} label={t('UDP')} />
          <FormSelectOption value={Protocol.ICMP} label={t('ICMP')} />
          <FormSelectOption value={Protocol.ALL} label={t('All')} />
        </FormSelect>
        <FormFieldHelper
          fieldId="rule-protocol"
          error={touched.protocol ? errors.protocol : undefined}
        />
      </FormGroup>

      {showPortRange && (
        <>
          <FormGroup label={t('Port From')} isRequired fieldId="rule-port-from">
            <TextInput
              id="rule-port-from"
              name="portFrom"
              type="number"
              value={values.portFrom}
              onChange={handleChange}
              onBlur={handleBlur}
              validated={touched.portFrom && errors.portFrom ? 'error' : 'default'}
              aria-label={t('Port From')}
            />
            <FormFieldHelper
              fieldId="rule-port-from"
              error={touched.portFrom ? errors.portFrom : undefined}
            />
          </FormGroup>

          <FormGroup label={t('Port To')} isRequired fieldId="rule-port-to">
            <TextInput
              id="rule-port-to"
              name="portTo"
              type="number"
              value={values.portTo}
              onChange={handleChange}
              onBlur={handleBlur}
              validated={touched.portTo && errors.portTo ? 'error' : 'default'}
              aria-label={t('Port To')}
            />
            <FormFieldHelper
              fieldId="rule-port-to"
              error={touched.portTo ? errors.portTo : undefined}
            />
          </FormGroup>
        </>
      )}

      <FormGroup label={t('IPv4 CIDR')} fieldId="rule-ipv4-cidr">
        <TextInput
          id="rule-ipv4-cidr"
          name="ipv4Cidr"
          type="text"
          value={values.ipv4Cidr}
          onChange={handleChange}
          onBlur={handleBlur}
          validated={touched.ipv4Cidr && errors.ipv4Cidr ? 'error' : 'default'}
          placeholder="0.0.0.0/0"
          aria-label={t('IPv4 CIDR')}
        />
        <FormFieldHelper
          fieldId="rule-ipv4-cidr"
          helperText={t('Example: 192.168.1.0/24 or 0.0.0.0/0 for all')}
          error={touched.ipv4Cidr ? errors.ipv4Cidr : undefined}
        />
      </FormGroup>

      <FormGroup label={t('IPv6 CIDR (Optional)')} fieldId="rule-ipv6-cidr">
        <TextInput
          id="rule-ipv6-cidr"
          name="ipv6Cidr"
          type="text"
          value={values.ipv6Cidr}
          onChange={handleChange}
          onBlur={handleBlur}
          validated={touched.ipv6Cidr && errors.ipv6Cidr ? 'error' : 'default'}
          placeholder="::/0"
          aria-label={t('IPv6 CIDR (Optional)')}
        />
        <FormFieldHelper
          fieldId="rule-ipv6-cidr"
          helperText={t('Example: 2001:db8::/32 or ::/0 for all')}
          error={touched.ipv6Cidr ? errors.ipv6Cidr : undefined}
        />
      </FormGroup>
    </>
  );
};
