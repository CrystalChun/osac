import type { CidrIpFamily } from '@osac/ui-components/validation/cidr-validation';

export const EXTERNAL_IP_POOLS_LIST_PATH = '/admin/infrastructure/external-ip-pools';

export interface ExternalIpPoolFormValues {
  metadata: { name: string; tenant: string };
  ipFamily: '' | CidrIpFamily;
  cidrs: string[];
}

export const getExternalIpPoolValues = (): ExternalIpPoolFormValues => ({
  metadata: { name: '', tenant: '' },
  ipFamily: '',
  cidrs: [''],
});
