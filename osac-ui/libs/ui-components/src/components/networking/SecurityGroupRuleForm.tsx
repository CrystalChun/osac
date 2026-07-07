import { FormGroup, FormSelect, FormSelectOption } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { Protocol } from '@osac/types';

import { useTranslation } from '../../hooks/useTranslation';
import { FormFieldHelper } from '../Form/FormFieldHelper';
import { InputField } from '../Form/InputField';

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

export const SecurityGroupRuleForm = ({ direction: _direction }: SecurityGroupRuleFormProps) => {
  const { t } = useTranslation();
  const { values, errors, touched, setFieldValue, handleBlur } = useFormikContext<RuleFormValues>();

  const showPortRange = values.protocol === Protocol.TCP || values.protocol === Protocol.UDP;

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
          <InputField
            name="portFrom"
            label={t('Port From')}
            fieldId="rule-port-from"
            type="number"
            isRequired
          />
          <InputField
            name="portTo"
            label={t('Port To')}
            fieldId="rule-port-to"
            type="number"
            isRequired
          />
        </>
      )}

      <InputField
        name="ipv4Cidr"
        label={t('IPv4 CIDR')}
        fieldId="rule-ipv4-cidr"
        helperText={t('Example: 192.168.1.0/24 or 0.0.0.0/0 for all')}
      />
      <InputField
        name="ipv6Cidr"
        label={t('IPv6 CIDR (Optional)')}
        fieldId="rule-ipv6-cidr"
        helperText={t('Example: 2001:db8::/32 or ::/0 for all')}
      />
    </>
  );
};
