import { Link } from 'react-router-dom';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ExternalIPPool, ExternalIPPoolStatus } from '@osac/types/private';
import { IPFamily } from '@osac/types/private';

import ExternalIpPoolActionsMenu from './ExternalIpPoolActionsMenu';
import ExternalIpPoolStatusLabel from './ExternalIpPoolStatusLabel';
import { useTranslation } from '../../hooks/useTranslation';

interface ExternalIpPoolsTableProps {
  pools: ExternalIPPool[];
}

export const ipFamilyLabel = (ipFamily?: IPFamily): string => {
  switch (ipFamily) {
    case IPFamily.IP_FAMILY_IPV4:
      return 'IPv4';
    case IPFamily.IP_FAMILY_IPV6:
      return 'IPv6';
    default:
      return '—';
  }
};

const formatCapacity = (status?: ExternalIPPoolStatus): string =>
  status ? `${status.available} / ${status.total}` : '—';

export const ExternalIpPoolsTable = ({ pools }: ExternalIpPoolsTableProps) => {
  const { t } = useTranslation();

  // Show the single CIDR inline; collapse multiple into a "<n> CIDRs" summary.
  const formatCidrs = (cidrs?: string[]): string => {
    if (!cidrs || cidrs.length === 0) {
      return '—';
    }
    if (cidrs.length === 1) {
      return cidrs[0];
    }
    return t('{{count}} CIDRs', { count: cidrs.length });
  };

  return (
    <Table aria-label={t('External IP pools')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('IP family')}</Th>
          <Th>{t('CIDRs')}</Th>
          <Th>{t('Available / Total')}</Th>
          <Th aria-label={t('Actions')} />
        </Tr>
      </Thead>
      <Tbody>
        {pools.map((pool) => (
          <Tr key={pool.id}>
            <Td dataLabel={t('Name')}>
              <Link to={`/admin/infrastructure/external-ip-pools/${pool.id}`}>
                {pool.metadata?.name}
              </Link>
            </Td>
            <Td dataLabel={t('Status')}>
              <ExternalIpPoolStatusLabel state={pool.status?.state} />
            </Td>
            <Td dataLabel={t('IP family')}>{ipFamilyLabel(pool.spec?.ipFamily)}</Td>
            <Td dataLabel={t('CIDRs')}>{formatCidrs(pool.spec?.cidrs)}</Td>
            <Td dataLabel={t('Available / Total')}>{formatCapacity(pool.status)}</Td>
            <Td dataLabel={t('Actions')} isActionCell>
              <ExternalIpPoolActionsMenu pool={pool} />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};
