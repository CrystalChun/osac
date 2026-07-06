import { Button } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { Protocol, type SecurityRule } from '@osac/types';

import { useTranslation } from '../../hooks/useTranslation';
import { SubtleContent } from '../SubtleContent/SubtleContent';

interface SecurityGroupRulesTableProps {
  rules: SecurityRule[];
  direction: 'ingress' | 'egress';
  onAddRule: () => void;
  onEditRule: (index: number) => void;
  onDeleteRule: (index: number) => void;
}

const protocolToString = (protocol: Protocol): string => {
  switch (protocol) {
    case Protocol.TCP:
      return 'TCP';
    case Protocol.UDP:
      return 'UDP';
    case Protocol.ICMP:
      return 'ICMP';
    case Protocol.ALL:
      return 'All';
    default:
      return 'Unknown';
  }
};

const formatPortRange = (portFrom?: number, portTo?: number): string => {
  if (portFrom === undefined && portTo === undefined) {
    return '—';
  }
  if (portFrom === portTo) {
    return String(portFrom);
  }
  return `${portFrom ?? '—'}-${portTo ?? '—'}`;
};

const formatCidr = (ipv4Cidr?: string, ipv6Cidr?: string): string => {
  const cidrs = [ipv4Cidr, ipv6Cidr].filter(Boolean);
  return cidrs.length > 0 ? cidrs.join(', ') : '—';
};

export const SecurityGroupRulesTable = ({
  rules,
  direction,
  onAddRule,
  onEditRule,
  onDeleteRule,
}: SecurityGroupRulesTableProps) => {
  const { t } = useTranslation();

  const cidrLabel = direction === 'ingress' ? t('Source CIDR') : t('Destination CIDR');

  if (rules.length === 0) {
    return (
      <div>
        <SubtleContent component="p">
          {direction === 'ingress'
            ? t('No inbound rules yet. Add one to allow incoming traffic.')
            : t('No outbound rules yet. Add one to allow outgoing traffic.')}
        </SubtleContent>
        <Button variant="primary" onClick={onAddRule} style={{ marginTop: '1rem' }}>
          {t('Add rule')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button variant="primary" onClick={onAddRule} style={{ marginBottom: '1rem' }}>
        {t('Add rule')}
      </Button>
      <Table aria-label={`${direction} rules`} variant="compact" borders>
        <Thead>
          <Tr>
            <Th>{t('Protocol')}</Th>
            <Th>{t('Port Range')}</Th>
            <Th>{cidrLabel}</Th>
            <Th>{t('Actions')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rules.map((rule, index) => (
            <Tr key={index}>
              <Td dataLabel="Protocol">{protocolToString(rule.protocol)}</Td>
              <Td dataLabel="Port Range">{formatPortRange(rule.portFrom, rule.portTo)}</Td>
              <Td dataLabel={cidrLabel}>{formatCidr(rule.ipv4Cidr, rule.ipv6Cidr)}</Td>
              <Td dataLabel="Actions">
                <Button variant="link" isInline onClick={() => onEditRule(index)}>
                  {t('Edit')}
                </Button>
                {' | '}
                <Button variant="link" isInline isDanger onClick={() => onDeleteRule(index)}>
                  {t('Delete')}
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  );
};
