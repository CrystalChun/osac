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
      <CardTitle>{t('vm.details.networking.title')}</CardTitle>
      <CardBody>
        {networkAttachments.length > 0 ? (
          <Table aria-label={t('vm.details.networking.title')} variant="compact" borders>
            <Thead>
              <Tr>
                <Th>{t('vm.details.networking.virtualNetwork')}</Th>
                <Th>{t('vm.details.networking.subnet')}</Th>
                <Th>{t('vm.details.networking.securityGroups')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {networkingRows.map((row, index) => (
                <Tr key={`network-attachment-${index}`}>
                  <Td dataLabel={t('vm.details.networking.virtualNetwork')}>
                    {row.virtualNetwork}
                  </Td>
                  <Td dataLabel={t('vm.details.networking.subnet')}>{row.subnet}</Td>
                  <Td dataLabel={t('vm.details.networking.securityGroups')}>
                    {row.securityGroups}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <SubtleContent component="p">{t('vm.details.networking.empty')}</SubtleContent>
        )}
      </CardBody>
    </Card>
  );
};

export default VmNetworkingTab;
