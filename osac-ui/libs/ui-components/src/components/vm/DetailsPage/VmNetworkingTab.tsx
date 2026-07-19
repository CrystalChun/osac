import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ComputeInstance } from '@osac/types';

import { useVmDetailsDisplay } from './useVmDetailsDisplay';
import { useTranslation } from '../../../hooks/useTranslation';
import { SubtleContent } from '../../SubtleContent/SubtleContent';

interface VmNetworkingTabProps {
  vm: ComputeInstance;
}

const VmNetworkingTab = ({ vm }: VmNetworkingTabProps) => {
  const { t } = useTranslation();
  const { networkingRows } = useVmDetailsDisplay(vm);
  const networkAttachments = vm.spec?.networkAttachments ?? [];

  return (
    <Card isFullHeight>
      <CardTitle>{t('Networking')}</CardTitle>
      <CardBody>
        {networkAttachments.length > 0 ? (
          <Table aria-label={t('Networking')} variant="compact" borders>
            <Thead>
              <Tr>
                <Th>{t('Virtual network')}</Th>
                <Th>{t('Subnet')}</Th>
                <Th>{t('Security groups')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {networkingRows.map((row, index) => (
                <Tr key={`network-attachment-${index}`}>
                  <Td dataLabel={t('Virtual network')}>{row.virtualNetwork}</Td>
                  <Td dataLabel={t('Subnet')}>{row.subnet}</Td>
                  <Td dataLabel={t('Security groups')}>{row.securityGroups}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <SubtleContent component="p">{t('No virtual networks configured.')}</SubtleContent>
        )}
      </CardBody>
    </Card>
  );
};

export default VmNetworkingTab;
